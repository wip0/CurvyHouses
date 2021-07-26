data "aws_iam_policy_document" "AWSLambdaTrustPolicy" {
  statement {
    actions = ["sts:AssumeRole"]
    effect  = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}


data "aws_iam_policy_document" "lambda_inline_policy" {
  statement {
    actions = ["dynamodb:*"] // need to be reviewed
    resources = ["arn:aws:dynamodb:*:*:table/${aws_dynamodb_table.curvyhouses_ddb.name}*"]
  }
  statement {
    actions = ["s3:*"] // need to be reviewed
    resources = ["${aws_s3_bucket.curvyhouses_s3bucket.arn}/*"]
  }
  statement {
    actions = ["sqs:*"] // need to be reviewed
    resources = [aws_sqs_queue.curvyhouses_notify_queue.arn]
  }
}

resource "aws_iam_role" "curvyhouses_lambda_role" {
  name               = "curvyhouses_lambda_role"
  assume_role_policy = data.aws_iam_policy_document.AWSLambdaTrustPolicy.json
  inline_policy {
    name   = "curvyhouses-lambda-inline-policy"
    policy = data.aws_iam_policy_document.lambda_inline_policy.json
  }

  tags = {
    Name = var.stack_tag_name
  }
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution_policy" {
  role       = aws_iam_role.curvyhouses_lambda_role.name
  policy_arn = var.lambda_basic_execution_role
}

data "archive_file" "curvyhouses_line_hook_handler" {
    type        = "zip"
    source_dir  = "functions/line-web-hook"
    output_path = "line_hook.zip"
}

resource "aws_lambda_function" "curvy_lambda_line_hook" {
  filename         = "line_hook.zip"
  function_name    = "curvy_lambda_line_hook"
  handler          = "index.handler"
  role             = aws_iam_role.curvyhouses_lambda_role.arn
  runtime          = "nodejs14.x"
  source_code_hash = data.archive_file.curvyhouses_line_hook_handler.output_base64sha256
  environment {
    variables = {
      LINE_CHANNEL_ACCESS_TOKEN = var.line_channel_access_token
      LINE_CHANNEL_SECRET = var.line_channel_secret
      POLYGON_API_KEY = var.polygon_api_key
      MARKETSTACK_API_KEYS = var.marketstack_api_keys
      MARKETSTACK_ENDPOINT = var.marketstack_endpoint
      MARKETSTACK_ENABLE = var.marketstack_enable
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1
      CURVYHOUSES_TABLE = aws_dynamodb_table.curvyhouses_ddb.name
      CURVYHOUSES_BUCKET = aws_s3_bucket.curvyhouses_s3bucket.id
    }
  }

  tags = {
    Name = var.stack_tag_name
  }
}

data "archive_file" "curvyhouses_snp500_daily_run_handler" {
    type        = "zip"
    source_dir  = "functions/snp500"
    output_path = "snp500_daily_run_handler.zip"
}

resource "aws_lambda_function" "curvy_lambda_snp500_daily_run" {
  filename          = "snp500_daily_run_handler.zip"
  function_name     = "curvy_lambda_snp500_daily_run"
  handler           = "index.handler"
  role             = aws_iam_role.curvyhouses_lambda_role.arn
  runtime           = "nodejs14.x" # need to review
  timeout           = 120
  source_code_hash = data.archive_file.curvyhouses_snp500_daily_run_handler.output_base64sha256
  
  environment {
    variables = {
      LINE_CHANNEL_ACCESS_TOKEN = var.line_channel_access_token
      LINE_CHANNEL_SECRET = var.line_channel_secret
      POLYGON_API_KEY = var.polygon_api_key
      MARKETSTACK_API_KEYS = var.marketstack_api_keys
      MARKETSTACK_ENDPOINT = var.marketstack_endpoint
      MARKETSTACK_ENABLE = var.marketstack_enable
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1
      CURVYHOUSES_TABLE = aws_dynamodb_table.curvyhouses_ddb.name
      CURVYHOUSES_BUCKET = aws_s3_bucket.curvyhouses_s3bucket.id
      MAX_SYMBOLS = var.max_symbols
      CURVYHOUSES_QUEUE_URL = aws_sqs_queue.curvyhouses_notify_queue.id
    }
  }

  tags = {
    Name = var.stack_tag_name
  }
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call" {
    statement_id = "AllowExecutionFromCloudWatch"
    action = "lambda:InvokeFunction"
    function_name = aws_lambda_function.curvy_lambda_snp500_daily_run.function_name
    principal = "events.amazonaws.com"
    source_arn = aws_cloudwatch_event_rule.daily_cron.arn
}

data "archive_file" "curvyhouses_sqs_handler" {
    type        = "zip"
    source_dir  = "functions/sqs-handler"
    output_path = "sqs_handler.zip"
}

resource "aws_lambda_function" "curvy_lambda_sqs_handler" {
  filename          = "sqs_handler.zip"
  function_name     = "curvy_lambda_sqs_handler"
  handler           = "index.handler"
  role             = aws_iam_role.curvyhouses_lambda_role.arn
  runtime           = "nodejs14.x" # need to review
  timeout           = 120
  source_code_hash = data.archive_file.curvyhouses_sqs_handler.output_base64sha256
  reserved_concurrent_executions = 1
  
  environment {
    variables = {
      LINE_CHANNEL_ACCESS_TOKEN = var.line_channel_access_token
      LINE_CHANNEL_SECRET = var.line_channel_secret
      POLYGON_API_KEY = var.polygon_api_key
      MARKETSTACK_API_KEYS = var.marketstack_api_keys
      MARKETSTACK_ENDPOINT = var.marketstack_endpoint
      MARKETSTACK_ENABLE = var.marketstack_enable
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1
      CURVYHOUSES_TABLE = aws_dynamodb_table.curvyhouses_ddb.name
      CURVYHOUSES_BUCKET = aws_s3_bucket.curvyhouses_s3bucket.id
      MAX_SYMBOLS = var.max_symbols
      CURVYHOUSES_QUEUE_URL = aws_sqs_queue.curvyhouses_notify_queue.id
    }
  }

  tags = {
    Name = var.stack_tag_name
  }
}

resource "aws_lambda_event_source_mapping" "curvy_lambda_sqs_event_source" {
  event_source_arn = aws_sqs_queue.curvyhouses_notify_queue.arn
  function_name    = aws_lambda_function.curvy_lambda_sqs_handler.arn
  enabled          = true
  batch_size       = 1
}
