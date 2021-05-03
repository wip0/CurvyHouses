resource "aws_lambda_permission" "apigw" {
   statement_id  = "AllowAPIGatewayInvoke"
   action        = "lambda:InvokeFunction"
   function_name = aws_lambda_function.curvy_lambda.function_name
   principal     = "apigateway.amazonaws.com"

   # The "/*/*" portion grants access from any method on any resource
   # within the API Gateway REST API.
   source_arn = "${aws_apigatewayv2_api.curvyhouses_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_api" "curvyhouses_api" {
  name          = "curvyhouses-http-api"
  protocol_type = "HTTP"
  disable_execute_api_endpoint = true

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["*"]
    allow_methods     = ["*"]
    allow_origins     = ["*"]
    expose_headers    = ["*"]
    max_age           = 3600
  }

  tags = {
    Name = var.stack_tag_name
  }
}

resource "aws_apigatewayv2_domain_name" "api_domain" {
  domain_name = "api.${var.domain_name}"

  domain_name_configuration {
    certificate_arn = var.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_cloudwatch_log_group" "curvyhouses_api_log" {
  name = "/api/curvyhouses_log"
  retention_in_days = 30
}


resource "aws_apigatewayv2_stage" "stage" {
  api_id      = aws_apigatewayv2_api.curvyhouses_api.id
  name        = "$default"
  auto_deploy = true
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.curvyhouses_api_log.arn
    format = jsonencode(
      {
        httpMethod     = "$context.httpMethod"
        ip             = "$context.identity.sourceIp"
        protocol       = "$context.protocol"
        requestId      = "$context.requestId"
        requestTime    = "$context.requestTime"
        responseLength = "$context.responseLength"
        routeKey       = "$context.routeKey"
        status         = "$context.status"
      }
    )
  }

  lifecycle {
    ignore_changes = [
      deployment_id,
      default_route_settings
    ]
  }
}

resource "aws_apigatewayv2_api_mapping" "api_mapping" {
  api_id      = aws_apigatewayv2_api.curvyhouses_api.id
  domain_name = aws_apigatewayv2_domain_name.api_domain.id
  stage       = aws_apigatewayv2_stage.stage.id
}

resource "aws_apigatewayv2_route" "route" {
  api_id             = aws_apigatewayv2_api.curvyhouses_api.id
  route_key          = "POST /webhook/line"
  target             = "integrations/${aws_apigatewayv2_integration.service_integration.id}"
}

resource "aws_apigatewayv2_integration" "service_integration" {
  api_id           = aws_apigatewayv2_api.curvyhouses_api.id
  integration_type = "AWS_PROXY"

  connection_type      = "INTERNET"
  description          = "webhook/line integration"
  integration_method   = "POST"
  integration_uri      = aws_lambda_function.curvy_lambda.invoke_arn
  passthrough_behavior = "WHEN_NO_MATCH"

  lifecycle {
    ignore_changes = [
      passthrough_behavior
    ]
  }
}
