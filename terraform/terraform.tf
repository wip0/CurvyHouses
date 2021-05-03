terraform {
  backend "remote" {
    hostname     = "app.terraform.io"
    organization = "CurvyHouses"
    workspaces {
      name = "CurvyHouses-API"
    }
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "3.30.0"
    }
  }
}
