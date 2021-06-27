variable "stack_tag_name" {
  description = "Tag for each resource under this stack"
  type        = string
  default     = "curvyhouses"
}

variable "domain_name" {
  description = "Domain name"
  type        = string
}

variable "certificate_arn" {
  description = "ARN of ACM certificate"
  type        = string
}

variable "lambda_basic_execution_role" {
  description = "ARN of lambda basic execution role"
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

variable "marketstack_endpoint" {
  description = "Marketstack endpoint"
  type        = string
}

variable "marketstack_api_key" {
  description = "Marketstack api key"
  type        = string
}

variable "marketstack_enable" {
  description = "Enable to use marketstack"
  type = bool
}