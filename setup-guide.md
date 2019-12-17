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
2. Follow step 2, to install **Node JS** and **Orthanc**
3. Follow step 3.3, to install **lite-server**
4. Copy following directories from below GITHUB location to one of the parent directory of your own in your local machine
    - Link: https://github.com/harshitdesai1986/file-upload
    1. dist
    2. backend
    3. upstream
    4. test-data
5. Open terminal and execute following commands to start each application
    1. upstream
    ```javascript
    node nodeapi.js
    ```
    2. backend
    ```javascript
    node app.js
    ```
    3. dist (Execute the command from the parent directory)
    ```javascript
    lite-server --baseDir="dist/file-upload"
    ```
    **PS.** This will start the Angular(Frontend) application in your default browser on port 3001 