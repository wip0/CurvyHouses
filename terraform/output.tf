output "name_servers" {
  description = "ns"
  value       = aws_route53_zone.curvyhouses.name_servers
}

output "curvy_dns_name" {
  description = "url for access service directly via elb"
  value       = aws_lb.curvy_alb.dns_name
}