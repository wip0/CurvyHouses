resource "aws_lambda_permission" "apigw" {
   statement_id  = "AllowAPIGatewayInvoke"
   action        = "lambda:InvokeFunction"
   function_name = aws_lambda_function.curvy_lambda.function_name
   principal     = "apigateway.amazonaws.com"

   # The "/*/*" portion grants access from any method on any resource
   # within the API Gateway REST API.
   source_arn = "${aws_api_gateway_rest_api.curvyhouses.execution_arn}/*/*"
}

resource "aws_api_gateway_rest_api" "curvyhouses" {
  name = "curvyhouses"
  description = "-"
}

resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.curvyhouses.id
  parent_id   = aws_api_gateway_rest_api.curvyhouses.root_resource_id
  path_part   = "hello"
}

resource "aws_api_gateway_method" "proxy" {
   rest_api_id   = aws_api_gateway_rest_api.curvyhouses.id
   resource_id   = aws_api_gateway_resource.proxy.id
   http_method   = "GET"
   authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda" {
   rest_api_id = aws_api_gateway_rest_api.curvyhouses.id
   resource_id = aws_api_gateway_method.proxy.resource_id
   http_method = aws_api_gateway_method.proxy.http_method

   integration_http_method = "POST"
   type                    = "AWS_PROXY"
   uri                     = aws_lambda_function.curvy_lambda.invoke_arn
}

resource "aws_api_gateway_method_response" "response_200" {
  rest_api_id = aws_api_gateway_rest_api.curvyhouses.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy.http_method
  status_code = "200"
}


resource "aws_api_gateway_deployment" "curvyhouses" {
  depends_on = [
    aws_api_gateway_integration.lambda,
    # aws_api_gateway_integration.lambda_root,
  ]

  rest_api_id = aws_api_gateway_rest_api.curvyhouses.id
}

resource "aws_api_gateway_stage" "dev" {
  deployment_id = aws_api_gateway_deployment.curvyhouses.id
  rest_api_id   = aws_api_gateway_rest_api.curvyhouses.id
  stage_name    = "dev"
}
