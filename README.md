# Securing-Microservices-Architecture
This repository contains an implementation of a secure microservices architecture using Node.js and Express. The architecture includes JWT for authentication, role-based access control (RBAC) for authorization, HTTPS for secure communication, and rate-limiting to prevent abuse.

## Installation
#### 1. Clone the repository.
```
git clone https://github.com/zno-dmnc/Securing-Microservices-Architecture.git
cd Securing-Microservices-Architecture
```
#### 2. Install dependencies.
```
npm install
```

## Microservices Overview
**1. Customer Service (`customer-service/`):** Manages customer-related operations.  
**2. Order Service (`order-service/`):** Manages order-related operations.  
**3. Product Service (`product-service/`):** Manages product-related operations.  

## Running the Application
**Step 1. Start the Microservices:** Start each microservice (e.g., `customer-service`, `order-service`, `product-service`) in separate terminal windows.
```
node user-service.js
```
```
node order-service.js
```
```
node product-service.js
```
**Step 2. Start the API Gateway:** Navigate to the root of the project and run the gateway.js file, which serves as the entry point for routing requests to the appropriate microservices:
```
node gateway.js
```
**Step 3. Verify that the gateway is running:**
```
https://localhost:3000
```

## Interacting with Microservices
Once the gateway is running, use Postman to send requests to the respective services through the API Gateway. Below is an example of how to make requests to the services via the gateway.  

**1. User Authentication**
- **URL:** https://localhost:3000/users/login
- **Method:** POST
- **Headers:** `Content-Type: application/json`
- **Body (Raw JSON):**
```
{
  "username": "admin",
  "password": "password123"
}
```

