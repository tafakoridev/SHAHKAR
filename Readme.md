# Shahkar API Repository

Welcome to the Shahkar API repository! This repository provides two API endpoints to facilitate user authentication and verification. Please find the details below on how to use these endpoints.

## Endpoints

### 1. `/getToken`

**Endpoint URL:** `/getToken`

**Method:** `POST`

**Description:** This endpoint allows you to obtain an authentication token, which you can use for subsequent API requests. To get a token, you need to send a valid mobile number and a national code.

**Request Parameters:**

- `mobile` (string): The user's mobile number.
- `nationalCode` (string): The user's national code.

**Example Request:**

```json
POST /getToken
in header
{
    "username": "",
    "password": ""
}
```

**Example Response:**

```json
{
    "token": "your_authentication_token_here"
}
```

### 2. `/check`

**Endpoint URL:** `/check`

**Method:** `POST`

**Description:** This endpoint allows you to check if a user is valid or authorized by providing their mobile number and national code along with the authentication token obtained from the `/getToken` endpoint.

**Request Parameters:**

- `token` (string): The authentication token obtained from `/getToken`.
- `mobile` (string): The user's mobile number.
- `nationalCode` (string): The user's national code.

**Example Request:**

```json
POST /check
{
    "token": "your_authentication_token_here",
    "mobile": "1234567890",
    "nationalCode": "123456789"
}
```

**Example Response:**

```json
{
    "isValid": true
}
```

## Authentication

To use these endpoints, you need to obtain an authentication token by calling the `/getToken` endpoint first. You should include this token in the header of your requests to the `/check` endpoint for user verification.

```http
Authorization: Bearer your_authentication_token_here
```

## Error Handling

- If the provided mobile and national code do not match any user, you will receive an error response.
- If the authentication token is missing or invalid when calling the `/check` endpoint, you will also receive an error response.

## Getting Started

1. Obtain an authentication token by calling the `/getToken` endpoint.
2. Use the obtained token to make requests to the `/check` endpoint for user verification.

Please refer to the examples provided above to get started with the Shahkar API. If you encounter any issues or have questions, feel free to reach out for assistance.

Thank you for using Shahkar API!
