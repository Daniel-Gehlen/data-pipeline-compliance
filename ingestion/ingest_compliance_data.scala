/**
 * ===========================================
 * JOB DE INGESTÃO - DADOS DE COMPLIANCE
 * ===========================================
 *
 * Job Apache Spark em Scala para ingestão de dados brutos
 * de compliance de fontes diversas (JDBC, JSON, Kafka).
 *
 * Autor: Data Engineering Team
 * Data: 2026-03-29
 * Versão: 1.0.0
 */

package com.company.data.pipeline.ingestion

import org.apache.spark.sql.{SparkSession, DataFrame}
import org.apache.spark.sql.functions._
import org.apache.spark.sql.types._
import io.delta.tables.DeltaTable
import org.apache.log4j.{Level, Logger}
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/**
 * Classe principal para ingestão de dados de compliance
 */
object IngestComplianceData {

  // Configuração de logging
  Logger.getLogger("org").setLevel(Level.WARN)
  Logger.getLogger("akka").setLevel(Level.WARN)

  /**
   * Configuração do job
   */
  case class JobConfig(
    executionDate: String,
    sourceType: String,
    sourcePath: String,
    outputPath: String,
    checkpointPath: String
  )

  /**
   * Schema para dados de compliance
   */
  val complianceSchema = StructType(Array(
    StructField("id", StringType, nullable = false),
    StructField("transaction_date", TimestampType, nullable = false),
    StructField("entity_id", StringType, nullable = false),
    StructField("entity_type", StringType, nullable = false),
    StructField("transaction_type", StringType, nullable = false),
    StructField("amount", DecimalType(18, 2), nullable = true),
    StructField("currency", StringType, nullable = true),
    StructField("status", StringType, nullable = false),
    StructField("risk_score", IntegerType, nullable = true),
    StructField("compliance_flags", ArrayType(StringType), nullable = true),
    StructField("metadata", MapType(StringType, StringType), nullable = true),
    StructField("created_at", TimestampType, nullable = false),
    StructField("updated_at", TimestampType, nullable = false),
    StructField("source_system", StringType, nullable = false),
    StructField("batch_id", StringType, nullable = false)
  ))

  /**
   * Função principal do job
   */
  def main(args: Array[String]): Unit = {

    // Parse de argumentos
    val config = parseArguments(args)

    // Inicializar Spark Session
    val spark = createSparkSession()

    try {
      println(s"[INFO] Iniciando ingestão de dados de compliance - Data: ${config.executionDate}")
      println(s"[INFO] Fonte: ${config.sourceType} - ${config.sourcePath}")
      println(s"[INFO] Destino: ${config.outputPath}")

      // Ler dados da fonte
      val rawData = readFromSource(spark, config)

      // Validar schema
      val validatedData = validateSchema(rawData, config)

      // Enriquecer dados
      val enrichedData = enrichData(validatedData, config)

      // Escrever no Delta Lake com versionamento
      writeToDeltaLake(enrichedData, config)

      // Registrar metadados de execução
      registerExecutionMetadata(spark, config, enrichedData.count())

      println(s"[INFO] Ingestão concluída com sucesso!")

    } catch {
      case e: Exception =>
        println(s"[ERRO] Falha na ingestão: ${e.getMessage}")
        e.printStackTrace()
        System.exit(1)
    } finally {
      spark.stop()
    }
  }

  /**
   * Parse de argumentos da linha de comando
   */
  def parseArguments(args: Array[String]): JobConfig = {
    val argMap = args.sliding(2, 2).collect {
      case Array("--date", value) => "date" -> value
      case Array("--source", value) => "source" -> value
      case Array("--output", value) => "output" -> value
    }.toMap

    JobConfig(
      executionDate = argMap.getOrElse("date",
        LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))),
      sourceType = argMap.getOrElse("source", "jdbc"),
      sourcePath = argMap.getOrElse("sourcePath",
        "jdbc:postgresql://localhost:5432/compliance_db"),
      outputPath = argMap.getOrElse("output", "/data/raw/compliance"),
      checkpointPath = argMap.getOrElse("checkpoint", "/data/checkpoints/compliance")
    )
  }

  /**
   * Cria sessão Spark com configurações otimizadas
   */
  def createSparkSession(): SparkSession = {
    SparkSession.builder()
      .appName("IngestComplianceData")
      .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
      .config("spark.sql.catalog.spark_catalog",
        "org.apache.spark.sql.delta.catalog.DeltaCatalog")
      .config("spark.sql.adaptive.enabled", "true")
      .config("spark.sql.adaptive.coalescePartitions.enabled", "true")
      .config("spark.sql.shuffle.partitions", "10")
      .config("spark.executor.memory", "4g")
      .config("spark.driver.memory", "2g")
      .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
      .getOrCreate()
  }

  /**
   * Lê dados da fonte especificada
   */
  def readFromSource(spark: SparkSession, config: JobConfig): DataFrame = {
    config.sourceType.toLowerCase match {
      case "jdbc" =>
        println("[INFO] Lendo dados de fonte JDBC...")
        spark.read
          .format("jdbc")
          .option("url", config.sourcePath)
          .option("dbtable", s"(SELECT * FROM compliance_transactions WHERE DATE(transaction_date) = '${config.executionDate}') as t")
          .option("user", sys.env.getOrElse("DB_USER", "compliance_user"))
          .option("password", sys.env.getOrElse("DB_PASSWORD", ""))
          .option("driver", "org.postgresql.Driver")
          .option("fetchsize", "10000")
          .load()

      case "json" =>
        println("[INFO] Lendo dados de fonte JSON...")
        spark.read
          .option("multiline", "true")
          .option("mode", "PERMISSIVE")
          .option("columnNameOfCorruptRecord", "_corrupt_record")
          .schema(complianceSchema)
          .json(s"${config.sourcePath}/${config.executionDate}/*.json")

      case "kafka" =>
        println("[INFO] Lendo dados de fonte Kafka...")
        spark.read
          .format("kafka")
          .option("kafka.bootstrap.servers",
            sys.env.getOrElse("KAFKA_BROKERS", "localhost:9092"))
          .option("subscribe", "compliance-transactions")
          .option("startingOffsets", "earliest")
          .option("endingOffsets", "latest")
          .load()
          .selectExpr("CAST(value AS STRING) as json_value")
          .select(from_json(col("json_value"), complianceSchema).as("data"))
          .select("data.*")

      case _ =>
        throw new IllegalArgumentException(s"Tipo de fonte não suportado: ${config.sourceType}")
    }
  }

  /**
   * Valida schema dos dados
   */
  def validateSchema(df: DataFrame, config: JobConfig): DataFrame = {
    println("[INFO] Validando schema dos dados...")

    // Verificar campos obrigatórios
    val requiredFields = Seq("id", "transaction_date", "entity_id", "entity_type",
      "transaction_type", "status", "created_at", "updated_at", "source_system", "batch_id")

    requiredFields.foreach { field =>
      if (!df.columns.contains(field)) {
        throw new IllegalArgumentException(s"Campo obrigatório não encontrado: $field")
      }
    }

    // Verificar nulos em campos obrigatórios
    val nullCounts = requiredFields.map(field =>
      field -> df.filter(col(field).isNull).count()
    ).toMap

    val fieldsWithNulls = nullCounts.filter(_._2 > 0)
    if (fieldsWithNulls.nonEmpty) {
      println(s"[AVISO] Campos com valores nulos: $fieldsWithNulls")
    }

    // Validar tipos de dados
    val typedDF = df
      .withColumn("amount", col("amount").cast(DecimalType(18, 2)))
      .withColumn("risk_score", col("risk_score").cast(IntegerType))
      .withColumn("transaction_date", col("transaction_date").cast(TimestampType))
      .withColumn("created_at", col("created_at").cast(TimestampType))
      .withColumn("updated_at", col("updated_at").cast(TimestampType))

    typedDF
  }

  /**
   * Enriquece dados com metadados e transformações
   */
  def enrichData(df: DataFrame, config: JobConfig): DataFrame = {
    println("[INFO] Enriquecendo dados...")

    val batchId = s"batch_${config.executionDate}_${System.currentTimeMillis()}"

    df
      // Adicionar metadados de processamento
      .withColumn("batch_id", lit(batchId))
      .withColumn("processing_date", lit(config.executionDate).cast(DateType))
      .withColumn("ingestion_timestamp", current_timestamp())

      // Normalizar strings
      .withColumn("entity_type", upper(trim(col("entity_type"))))
      .withColumn("transaction_type", upper(trim(col("transaction_type"))))
      .withColumn("status", upper(trim(col("status"))))
      .withColumn("currency", upper(trim(col("currency"))))

      // Calcular métricas derivadas
      .withColumn("amount_usd",
        when(col("currency") === "BRL", col("amount") * 0.19)
        .when(col("currency") === "EUR", col("amount") * 1.08)
        .otherwise(col("amount"))
      )

      // Classificar nível de risco
      .withColumn("risk_level",
        when(col("risk_score") >= 80, "HIGH")
        .when(col("risk_score") >= 50, "MEDIUM")
        .otherwise("LOW")
      )

      // Adicionar flags de compliance
      .withColumn("requires_review",
        when(col("risk_score") >= 70 ||
          array_contains(col("compliance_flags"), "SUSPICIOUS"), true)
        .otherwise(false)
      )

      // Selecionar colunas finais
      .select(
        "id", "transaction_date", "entity_id", "entity_type",
        "transaction_type", "amount", "currency", "amount_usd",
        "status", "risk_score", "risk_level", "compliance_flags",
        "requires_review", "metadata", "created_at", "updated_at",
        "source_system", "batch_id", "processing_date", "ingestion_timestamp"
      )
  }

  /**
   * Escreve dados no Delta Lake com versionamento
   */
  def writeToDeltaLake(df: DataFrame, config: JobConfig): Unit = {
    println("[INFO] Escrevendo dados no Delta Lake...")

    val outputPath = s"${config.outputPath}/processing_date=${config.executionDate}"

    // Verificar se tabela Delta já existe
    val deltaTableExists = DeltaTable.isDeltaTable(outputPath)

    if (deltaTableExists) {
      println("[INFO] Tabela Delta existente. Executando merge...")

      val deltaTable = DeltaTable.forPath(outputPath)

      deltaTable.as("target")
        .merge(
          df.as("source"),
          "target.id = source.id"
        )
        .whenMatched()
        .updateAll()
        .whenNotMatched()
        .insertAll()
        .execute()

    } else {
      println("[INFO] Criando nova tabela Delta...")

      df.write
        .format("delta")
        .mode("overwrite")
        .option("overwriteSchema", "true")
        .option("mergeSchema", "true")
        .partitionBy("processing_date", "entity_type")
        .save(outputPath)
    }

    // Otimizar tabela (compactação)
    println("[INFO] Otimizando tabela Delta...")
    val deltaTable = DeltaTable.forPath(outputPath)
    deltaTable.optimize().executeCompaction()

    // Limpar versões antigas (manter 30 dias)
    deltaTable.vacuum(720) // 30 dias em horas

    println(s"[INFO] Dados escritos com sucesso em: $outputPath")
  }

  /**
   * Registra metadados de execução para auditoria
   */
  def registerExecutionMetadata(
    spark: SparkSession,
    config: JobConfig,
    recordCount: Long
  ): Unit = {
    println("[INFO] Registrando metadados de execução...")

    import spark.implicits._

    val metadata = Seq(
      (
        s"ingestion_${System.currentTimeMillis()}",
        config.executionDate,
        "ingestion",
        "compliance_data",
        "completed",
        recordCount,
        LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
        config.sourceType,
        config.outputPath,
        "success"
      )
    ).toDF(
      "execution_id",
      "processing_date",
      "pipeline_stage",
      "dataset_name",
      "status",
      "record_count",
      "execution_timestamp",
      "source_type",
      "destination_path",
      "result"
    )

    val auditPath = "/data/audit/execution_metadata"

    metadata.write
      .format("delta")
      .mode("append")
      .option("mergeSchema", "true")
      .save(auditPath)

    println("[INFO] Metadados de execução registrados com sucesso")
  }
}
