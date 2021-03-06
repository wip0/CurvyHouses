variable "domain_name" {
  description = "Domain name"
  type        = string
}

variable "certificate_arn" {
  description = "ARN of ACM certificate"
  type        = string
}

variable "lambda_basic_execution_role" {
  description = "ARN of lambda execution role"
  type        = string
}

variable "aws_region" {
  description = "Specify AWS region"
  type        = string
}

variable "aws_lb_subnet_a" {
  description = "Subnet A for LB"
  type        = string
}

variable "aws_lb_subnet_b" {
  description = "Subnet B for LB"
  type        = string
}