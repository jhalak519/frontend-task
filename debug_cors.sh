#!/bin/bash
echo "Testing OPTIONS (Preflight)..."
curl -v -X OPTIONS http://localhost:5000/api/auth/register \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -H "Origin: http://localhost:5173"

echo -e "\n\nTesting POST (Register)..."
curl -v -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"name":"test","email":"test@example.com","password":"password123"}'
