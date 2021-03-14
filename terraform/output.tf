output "name_servers" {
  description = "ns"
  value       = aws_route53_zone.curvyhouses.name_servers
}

# output "curvy_alb_dns_name" {
#   description = "url for access service directly via elb"
#   value       = aws_lb.curvy_alb.dns_name
# }

# # For using api gateway v1 (REST)
# output "curvy_api_base_url" {
#   value = aws_api_gateway_deployment.curvyhouses.invoke_url
# }

# # For using api gateway v2 (HTTP)
output "curvy_api_endpoint_url" {
  value = aws_apigatewayv2_api.curvyhouses_api.api_endpoint
}