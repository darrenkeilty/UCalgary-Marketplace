# Set Up Guide

## Required Tech 
- npm 
- Docker 

## Instructions 
1. From the command line, move into the folder you would like the git repository to reside in.
2. Clone the git repository.
```bash
git clone git@csgit.ucalgary.ca:enioluwafe.balogun/seng513-202401-group-15.git
```
3. Move into to the folder: seng513-202401-group-15
4. Make a file called '.env' inside the current directory (seng513-202401-group-15). 
5. Copy the contents of the .env.sample file into your .env, and change the password as needed.
6. Move into the "backend" folder and run: 
```bash
npm install
```
7.  Move into the "frontend" folder and run: 
```bash
npm install
```
8. Move back into the root folder (seng513-202401-group-15)
9. Run the following command. Note that the -d option prevents you from being bombarded with logs when creating the containers:
```bash
docker compose up -d
```
10. Navigate to the following link in your browser to access the frontend: 
```bash
http://localhost:3000/
```
The backend runs on port 8080, here is a sample curl command you can run: 
```bash
curl localhost:8080
```
     
   To access the database (mysql) from the command line you can run this command, it will prompt you to enter the password from your .env file: 
```bash
docker exec -it db mysql -u root -p
```

## Database schema & seeding (how to run)

This project seeds the schema and example image files via the docker db container initialization scripts. The SQL schema and seed statements exist in  the `db/` folder. The example image files used by `LOAD_FILE()` are in `db/seeding_imgs/`.

Summary (what to run):
- Starting the containers with Docker Compose runs the database initialization scripts on first start

```bash
# from repository root
docker compose up -d
```

this creates the db container and runs the schema script (01-init.sql) and seeding script (02-seeding.sql) in lexicographical order.

Verifying the seeded data:
- executing the following commands will allow database seeding verification
```bash
# open DB in terminal
docker exec -it db mysql -u root -p
# then enter DB password

# To view seeded data, type:
USE marketplace;
SHOW TABLES;
# to view specfic table data (as example query):
SELECT * FROM users
```

- Note: the MySQL image runs scripts placed in `/docker-entrypoint-initdb.d/` only when the database is created for the first time.
- If you re-run `docker compose up` after the DB is already initialized, the init scripts will not re-run. To re-seed during development, remove the volume or the database data then start again

```bash
# stop and remove volumes
docker compose down -v
# then recreate
docker compose up -d
```

