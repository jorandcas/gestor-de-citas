#!/bin/bash

# Script de verificación antes del commit para producción
# Uso: ./pre-commit-check.sh

echo "🔍 Verificando que todo esté listo para producción..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

check() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ $2${NC}"
  else
    echo -e "${RED}❌ $2${NC}"
    ERRORS=$((ERRORS + 1))
  fi
}

warn() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ $2${NC}"
  else
    echo -e "${YELLOW}⚠️  $2${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
}

echo "📋 Verificando archivos críticos..."
echo ""

# Verificar Dockerfiles
check $(test -f "backend/Dockerfile" && echo 1 || echo 0) "backend/Dockerfile existe"
check $(test -f "frontend/Dockerfile" && echo 1 || echo 0) "frontend/Dockerfile existe"

# Verificar archivos .env
check $(test -f "backend/.env.production.example" && echo 1 || echo 0) "backend/.env.production.example existe"
check $(test -f "frontend/.env.production.example" && echo 1 || echo 0) "frontend/.env.production.example existe"

# Verificar que .env no esté en el repo (debe estar en .gitignore)
warn $(test ! -f "backend/.env" && echo 1 || echo 0) "backend/.env NO existe (correcto)"
warn $(test ! -f "frontend/.env" && echo 1 || echo 0) "frontend/.env NO existe (correcto)"

echo ""
echo "📦 Verificando package.json..."
echo ""

# Verificar scripts de backend
check $(grep -q "\"start\"" backend/package.json && echo 1 || echo 0) "backend tiene script 'start'"
check $(grep -q "\"build\"" frontend/package.json && echo 1 || echo 0) "frontend tiene script 'build'"

echo ""
echo "🐳 Verificando Dockerfiles..."
echo ""

# Verificar puertos en Dockerfiles
check $(grep -q "EXPOSE 3000" backend/Dockerfile && echo 1 || echo 0) "backend Dockerfile expone puerto 3000"
check $(grep -q "EXPOSE 80" frontend/Dockerfile && echo 1 || echo 0) "frontend Dockerfile expone puerto 80"

echo ""
echo "🙈 Verificando .gitignore..."
echo ""

# Verificar .gitignore de backend
check $(grep -q "node_modules/" backend/.gitignore && echo 1 || echo 0) "backend/.gitignore incluye node_modules"
check $(grep -q ".env" backend/.gitignore && echo 1 || echo 0) "backend/.gitignore incluye .env"
check $(grep -q "uploads/\*" backend/.gitignore && echo 1 || echo 0) "backend/.gitignore incluye uploads/"

echo ""
echo "📄 Verificando documentación..."
echo ""

check $(test -f "PLAN_DESPLIEGUE_PRODUCCION.md" && echo 1 || echo 0) "PLAN_DESPLIEGUE_PRODUCCION.md existe"
check $(test -f "README_PRODUCCION.md" && echo 1 || echo 0) "README_PRODUCCION.md existe"
check $(test -f "INICIO_RAPIDO.md" && echo 1 || echo 0) "INICIO_RAPIDO.md existe"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}🎉 ¡Todo está listo para producción!${NC}"
  echo ""
  echo "Siguientes pasos:"
  echo "  1. git add ."
  echo "  2. git commit -m 'Ready for production'"
  echo "  3. git push"
  echo ""
  echo " Luego sigue la guía en INICIO_RAPIDO.md"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Hay $WARNINGS advertencias. Revisa antes de continuar.${NC}"
  exit 0
else
  echo -e "${RED}❌ Hay $ERRORS errores que deben corregirse antes del despliegue.${NC}"
  exit 1
fi
