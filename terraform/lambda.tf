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

resource "aws_iam_role" "curvy_lambda_role" {
  name               = "curvy_lambda_role"
  assume_role_policy = data.aws_iam_policy_document.AWSLambdaTrustPolicy.json
}

resource "aws_iam_role_policy_attachment" "terraform_lambda_policy" {
  role       = aws_iam_role.curvy_lambda_role.name
  policy_arn = var.lambda_basic_execution_role
}

data "archive_file" "curvyhouses_handler" {
    type        = "zip"
    source_dir  = "functions"
    output_path = "curvyhouses_handler.zip"
}

resource "aws_lambda_function" "curvy_lambda" {
  filename = "curvyhouses_handler.zip"
  function_name    = "curvy_lambda"
  handler          = "index.handler"
  role             = aws_iam_role.curvy_lambda_role.arn
  runtime          = "nodejs14.x"
  source_code_hash = data.archive_file.curvyhouses_handler.output_base64sha256
    environment {
    variables = {
      LINE_CHANNEL_ACCESS_TOKEN = var.line_channel_access_token
      LINE_CHANNEL_SECRET = var.line_channel_secret
    }
  }
}
