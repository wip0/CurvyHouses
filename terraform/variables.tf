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

variable "aws_profile" {
  description = "Specify AWS region"
  type        = string
  default     = "default"
}
