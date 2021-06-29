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
    actions = ["dynamodb:*"]
    resources = ["arn:aws:dynamodb:*:*:table/curvyhouses*"]
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
    output_path = "curvyhouses_handler.zip"
}

resource "aws_lambda_function" "curvy_lambda_line_hook" {
  function_name    = "curvy_lambda_line_hook"
  handler          = "index.handler"
  role             = aws_iam_role.curvyhouses_lambda_role.arn
  runtime          = "nodejs14.x"
  source_code_hash = data.archive_file.curvyhouses_handler.output_base64sha256
    environment {
    variables = {
      LINE_CHANNEL_ACCESS_TOKEN = var.line_channel_access_token
      LINE_CHANNEL_SECRET = var.line_channel_secret
      MARKETSTACK_API_KEY = var.marketstack_api_key
      MARKETSTACK_ENDPOINT = var.marketstack_endpoint
      MARKETSTACK_ENABLE = var.marketstack_enable
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1
      CURVYHOUSES_TABLE = aws_dynamodb_table.curvyhouses_ddb.name
    }
  }

  tags = {
    Name = var.stack_tag_name
  }
}
