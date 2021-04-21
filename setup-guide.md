# Table of Contents
1. [Datebase - PostgreSQL](#section1)
    * 1.1 [Start PostgreSQL - Create & Connect](#section1.1)
2. [Backend](#section2)
    * 2.1 [NodeJS](#section2.1)
    * 2.2 [Orthanc](#section2.2)
3. [Frontend](#section3)
    * 3.1 [NodeJS](#section3.1)
    * 3.2 [Angular 8](#section3.2)
    * 3.3 [lite-server](#section3.3)
4. [Run/Deploy the application](#section4) 

<div id='section1'/>

# Datebase - PostgreSQL

- Install PostgreSQL version 12.x
    - Link: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
- Enter password **"admin"** when asked during installation

<div id='section1.1'/>

## Start PostgreSQL - Create & Connect

- Start pgAdmin4 application
    - It will open a webpage in your default browser
- On a webpage,
    - Upon prompt, Enter password **"admin"**
    - On the leftside panel,
        - Click on server
        - Click on postgrSQL 12
        - Right click on Databases, click Create > Database
        - Enter database name as "file-upload" and click Save
            - Make sure the Owner is "postgres"
        - Right click on "file-upload" under Databases and click "Query Tool..."
        - Paste the following script to create a table named "transactions" and click Execute button or press F5
```sql
CREATE TABLE public.transactions
(
    updatedby character varying(50) COLLATE pg_catalog."default" NOT NULL,
    uid character varying(100) COLLATE pg_catalog."default" NOT NULL,
    message character varying(500) COLLATE pg_catalog."default" NOT NULL,
    startdate bigint NOT NULL,
    enddate bigint,
    status character varying(20) COLLATE pg_catalog."default" NOT NULL,
    error character varying(200) COLLATE pg_catalog."default",
    updatedon bigint,
    CONSTRAINT transactions_pkey PRIMARY KEY (uid)
)
TABLESPACE pg_default;
ALTER TABLE public.transactions
    OWNER to postgres;
```


<div id='section2'/>

# Backend

<div id='section2.1'/>

## NodeJS

- Install Node JS version 12.x
    - Link: https://nodejs.org/en/download/

<div id='section2.2'/>

## Orthanc

- Install Orthanc version 19.10.2
    - Link: https://useast.os.ctl.io/tempstorage/OrthancInstaller-Win64-19.10.2.exe.zip?AWSAccessKeyId=Q8NJACOBE62UGEVIYFUR&Expires=1604561219&Signature=jZhrrNtYisC3V6wRlonIlw50fwY%3D


<div id='section3'/>

# Frontend

<div id='section3.1'/>

# Node JS

- Install Node JS version 12.x
    - Link: https://nodejs.org/en/download/

<div id='section3.2'/>

# Angular 8

- Install Angular 8 CLI using NPM
```javascript
npm install -g @angular/cli
```

<div id='section3.3'/>

# lite-server

- Install lite-server using NPM
```javascript
npm install -g lite-server
```

<div id='section4'/>

# Run/Deploy the application

1. Follow step 1, to install, create and connect to **PostgreSQL** database
2. Updated **pg_hba.conf** file at **C:\Program Files\PostgreSQL\12\data** by adding following at the bottom of the file
   ```
   # TYPE  DATABASE        USER            ADDRESS                 METHOD
    host    all             all             0.0.0.0/0               md5
   ```
   Restart PostgreSQL after above updates
3. Follow step 2, to install **Node JS** and **Orthanc**
4. Follow step 3.3, to install **lite-server**
5. Copy following directories from below GITHUB location to one of the parent directory of your own in your local machine
    - Link: https://github.com/harshitdesai1986/file-upload
    1. dist
    2. lite-server-config
    3. backend
    4. upstream
    5. test-data
6. Create following directories under **backend** directory
    1. Create **uploads** directory under **backend** directory, i.e **backend\uploads**
    2. Create **assembled** directory under **uploads** directory, i.e **backend\uploads\assembled**
7. Replace **localhost** with IP address
    1. ***If there is no change in Angular(Frontend) code***, do following:
        1. **backend** directory
            1. **postgres.js** file
                - Replace host value **localhost** with PostgreSQL installed machine/container **IP**
        2. **upstream** directory
            1. **node-pgsql.js** file
                - Replace host value **localhost** with PostgreSQL installed machine/container **IP**
            2. **upload.js** file
                - Replace orthancPath value **localhost** with Orthanc installed machine/container **IP**
        3. **dist\file-upload** directory
            1. **main-es5.58154a4bde57090b9a20.js** file
                - Find and replace value **localhost** having port **3000** with backend Node installed machine/container **IP**
                - Find and replace value **localhost** having port **3010** with upstream Node installed machine/container **IP**
            2. **main-es2015.58154a4bde57090b9a20.js** file
                - Find and replace value **localhost** having port **3000** with backend Node installed machine/container **IP**
                - Find and replace value **localhost** having port **3010** with upstream Node installed machine/container **IP**
    2. ***If there is a change in Angular Code***, do following:
        1. Download/Clone the entire project from: https://github.com/harshitdesai1986/file-upload
        2. **backend** directory
            1. **postgres.js** file
                - Replace host value **localhost** with PostgreSQL installed machine/container **IP**
        3. **upstream** directory
            1. **node-pgsql.js** file
                - Replace host value **localhost** with PostgreSQL installed machine/container **IP**
            2. **upload.js** file
                - Replace orthancPath value **localhost** with Orthanc installed machine/container **IP**
        4. **src\app** directory
            1. **file-upload-data.service.ts** file
                - Replace backendURL value **localhost** with backend Node installed machine/container **IP**
                - Replace upstreamURL value **localhost** with upstream Node installed machine/container **IP**
        5. **src\app\file-upload-home** directory
            1. **file-upload-home.component.ts** file
                - Replace URL value **localhost** with backend Node installed machine/container **IP**
        6. Follow step 3.2, to install **Angular 8 CLI**
        7. Execute following in terminal/CMD at **file-upload** directory
        ```javascript
        npm install // Execute this command only on fresh setup

        ng build --prod // Execute this command only on fresh setup
        ```
        **PS.** *ng build --prod* command would create/update **dist/file-upload** with updated code and IP addresses.         
7. Open terminal and execute following commands to start each application
    1. upstream
    ```javascript
    npm install // Execute this command only on fresh setup
    
    node nodeapi.js
    ```
    2. backend
    ```javascript
    npm install // Execute this command only on fresh setup

    node app.js
    ```
    3. dist (Execute the command from the parent directory of **dist**)
    ```javascript
    lite-server -c lite-server-config/bs-config.json
    ```
    **PS.** This will start the Angular(Frontend) application in your default browser on port 3001 
