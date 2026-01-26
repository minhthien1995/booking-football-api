.PHONY: help build up down restart logs shell mysql seed clean

# Colors for better output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
NC=\033[0m # No Color

help: ## Show this help message
	@echo '${GREEN}Football Booking System - Docker Commands${NC}'
	@echo ''
	@echo 'Usage:'
	@echo '  ${YELLOW}make${NC} ${GREEN}<target>${NC}'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  ${YELLOW}%-15s${NC} %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build Docker images
	@echo "${GREEN}Building Docker images...${NC}"
	docker compose build

up: ## Start all containers (production mode)
	@echo "${GREEN}Starting containers...${NC}"
	docker compose up -d
	@echo "${GREEN}Containers started successfully!${NC}"
	@echo "Backend: ${YELLOW}http://localhost:5000${NC}"
	@echo "phpMyAdmin: ${YELLOW}http://localhost:8080${NC}"

dev: ## Start all containers (development mode with hot reload)
	@echo "${GREEN}Starting development containers...${NC}"
	docker compose -f docker-compose.dev.yml up -d
	@echo "${GREEN}Development environment started!${NC}"
	@echo "Backend: ${YELLOW}http://localhost:5000${NC}"
	@echo "phpMyAdmin: ${YELLOW}http://localhost:8080${NC}"

down: ## Stop all containers
	@echo "${RED}Stopping containers...${NC}"
	docker compose down

down-v: ## Stop all containers and remove volumes (WARNING: deletes database)
	@echo "${RED}Stopping containers and removing volumes...${NC}"
	docker compose down -v
	@echo "${RED}Database deleted!${NC}"

restart: ## Restart all containers
	@echo "${YELLOW}Restarting containers...${NC}"
	docker compose restart

logs: ## Show logs from all containers
	docker compose logs -f

logs-backend: ## Show backend logs
	docker compose logs -f backend

logs-mysql: ## Show MySQL logs
	docker compose logs -f mysql

shell: ## Access backend container shell
	@echo "${GREEN}Accessing backend container...${NC}"
	docker compose exec backend sh

shell-mysql: ## Access MySQL shell
	@echo "${GREEN}Accessing MySQL...${NC}"
	docker compose exec mysql mysql -u root -prootpassword football_booking

seed: ## Seed database with sample data
	@echo "${GREEN}Seeding database...${NC}"
	docker compose exec backend node seed.js
	@echo "${GREEN}Database seeded successfully!${NC}"
	@echo "Admin: ${YELLOW}admin@footballbooking.com / admin123${NC}"

ps: ## Show running containers
	docker compose ps

rebuild: ## Rebuild and restart containers
	@echo "${YELLOW}Rebuilding containers...${NC}"
	docker compose up -d --build

clean: ## Remove all containers, images, and volumes
	@echo "${RED}Cleaning up Docker resources...${NC}"
	docker compose down -v --rmi all
	@echo "${RED}Cleanup complete!${NC}"

health: ## Check application health
	@echo "${GREEN}Checking application health...${NC}"
	@curl -s http://localhost:5000/api/health | json_pp || echo "${RED}Backend not responding${NC}"

test-api: ## Test API endpoints
	@echo "${GREEN}Testing API endpoints...${NC}"
	@echo "\n${YELLOW}1. Health Check:${NC}"
	@curl -s http://localhost:5000/api/health | json_pp
	@echo "\n${YELLOW}2. Get Fields:${NC}"
	@curl -s http://localhost:5000/api/fields | json_pp | head -n 30

backup-db: ## Backup MySQL database
	@echo "${GREEN}Creating database backup...${NC}"
	docker compose exec mysql mysqldump -u root -prootpassword football_booking > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "${GREEN}Backup created!${NC}"

stats: ## Show container resource usage
	docker stats --no-stream

# Default target
.DEFAULT_GOAL := help
