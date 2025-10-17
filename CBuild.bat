@echo off 
:: -cbm = clean build move
    :: --all //clean and build static library then cbm crow
    :: --crow //cbm crow only 
:: -cbmr = clean build move run
    :: --all //clean and build static library then cbmr crow
    :: --crow //cbmr crow only 
:: -cbsl = clean build static library only
:process_args
IF "%2" == "--all" (
    echo Cleaning and building backend static library...
    cd DataBend\CrowServer\CPPMath
    msbuild CPPMath.sln /t:Clean
    msbuild CPPMath.sln /t:Build
    cd ..
)
ELSE IF "%2" == "--crow" (
    cd DataBend\CrowServer
) ELSE (
    echo "%2 is not a valid flag, use either --crow or --all"
)

IF "%1" == "-cbmr" (
    echo Cleaning, building, moving, and running crow server...
    msbuild CrowServer.sln /t:Clean
    msbuild CrowServer.sln /t:Build
    COPY x64\Debug\CrowServer.exe ..
    cd ..
    cd ..
    start "API" cmd /k ".\DataBend\CrowServer.exe"
) ELSE IF "%1" == "-cbm" (
    echo Cleaning, building, and moving crow server...
    msbuild CrowServer.sln /t:Clean
    msbuild CrowServer.sln /t:Build
    COPY x64\Debug\CrowServer.exe ..
) ELSE IF "%1" == "-cbsl" (
    cd DataBend\CrowServer\CPPMath
    msbuild CPPMath.sln /t:Clean
    msbuild CPPMath.sln /t:Build
) ELSE (
    echo "%1 is not a valid flag, use either -cbmr,-cbm, or -cbsl"
)
cd ..
cd ..