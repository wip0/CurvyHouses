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

variable "line_channel_access_token" {
  description = "Line channel access token - get from line developer"
  type        = string
}

variable "line_channel_secret" {
  description = "Line channel secret - get from line developer"
  type        = string
}

variable "marketstock_endpoint" {
  description = "Marketstock endpoint"
  type        = string
}

variable "marketstock_api_key" {
  description = "Marketstock api key"
  type        = string
}