

const { log } = require('console')
const csvtojson = require('csvtojson')
const fs = require('fs')
const { join, parse } = require('path')
 
const csvfilepath = "Test1-CSV-data.csv"

csvtojson()
.fromFile(csvfilepath)
.then((json) => {
    // console.log(json)
    fs.writeFileSync("Test1-JSON-data.json",JSON.stringify(json, null, 2),"utf-8",(err) => { //without "null, 2" in stringify it returns only one array
        if(err) console.log(err)
    })
})


let dataJSON = fs.readFileSync('Test1-JSON-data.json'); //can also just read output.json here    //another way const data = JSON.parse(fs.readFileSync("output.json"));

let data = JSON.parse(dataJSON);


//defining key emission factors 

const MaxEngTorque = 2905.93  
//values in the same order as the table and in g/kWs
let NOxEmissionsFactor = [
    [0.0002777778,0.0002777778,0.0002777778,0.0002777778],
    [0.0005555556,0.0005555556,0.0005555556,0.0005555556],
    [0.0008333333,0.0008333333,0.0008333333,0.0008333333],
    [0.0011111111,0.0011111111,0.0011111111,0.0011111111]
] 

let CO2EmissionsFactor = [
    [0.0416666667,0.0416666667,0.0416666667,0.0416666667],
    [0.0694444444,0.0694444444,0.0694444444,0.0694444444],
    [0.0972222222,0.0972222222,0.0972222222,0.0972222222],
    [0.125,0.125,0.125,0.125]
] 

let PMEmissionsFactor = [
    [0.0000027778,0.0000027778,0.0000027778,0.0000027778],
    [0.0000055556,0.0000055556,0.0000055556,0.0000055556],
    [0.0000083333,0.0000083333,0.0000083333,0.0000083333],
    [0.0000111111,0.0000111111,0.0000111111,0.0000111111]
] 

// console.log('emission factors', CO2EmissionsFactor[1])


// //Option for implementation 2 - creating timestamps and replacing it in the object
// const date = new Date('11/17/2022 00:00:00');
// const timestamps = []
// const dateStrings = []
// for (let second = 0; second < 3600; second++) {
//     dateStrings.push(date.toLocaleString());

//     const time = date.getTime();
//     timestamps.push(time);
//     date.setSeconds(date.getSeconds() + 1);
// }
// // console.log('dateStrings',dateStrings);
// console.log('timestamps',timestamps);

// data.forEach((object, index) => {
//     console.log(index);
//     //converts from string to number
//     for (const property in object) {
//         const value = object[property];

//         if (property === 'timestamp') {
//             object[property] = dateStrings[index];
//         } else if (typeof value === 'string') {
//             object[property] = parseFloat(value);
//         }

//     }

    //THIS IS OPTIONFOR READING MILLISECONDSTIME FROM CSV directly
data.forEach((object, index) => {
    console.log(index);
    //converts from string to number
    for (const property in object) {
        let value = object[property];

        if (typeof value === 'string') {
            object[property] = parseFloat(value);
        }
        if (property === 'timestamp') {
            value = value*1000
            let date = new Date(value)
            let dateFormated = date.toLocaleString() //for putting in this format '17/11/2022, 01:00:00'
            object[property] = dateFormated;
    }
 }

 //adds engine power
 const torque = object["Engine torque"];
 const speed = object["Engine speed"];
 object.EnginePower = (torque * speed) / 9549 //Results in kW

    // if (0 <= torque && torque < (0.25 * MaxEngTorque) && 0 <= speed && speed < 1000) {
    //     object.CO2Emissions = CO2EmissionsFactor[0]
    // }

    let indexX;
    if (torque >= 0 && torque < 0.25 * MaxEngTorque) {
        indexX = 0;
    } else if (torque >= 0.25 * MaxEngTorque && torque < 0.5 * MaxEngTorque) {
        indexX = 1;
    } else if (torque >= 0.5 * MaxEngTorque && torque < 0.75 * MaxEngTorque) {
        indexX = 2;
    } else if (torque >= 0.75 * MaxEngTorque && torque <= MaxEngTorque) {
        indexX = 3;
    }
    let indexY;
    if (speed >= 0 && speed < 1000) {
        indexY = 0;
    } else if (speed >= 1000 && speed < 1500) {
        indexY = 1;
    } else if (speed >= 1500 && speed < 2000) {
        indexY = 2;
    } else if (speed >= 2000 && speed <= 2500) {
        indexY = 3;
    }

    // console.log('torque', torque);
    // console.log('speed', speed);
    console.log('CO2EmissionsFactor',CO2EmissionsFactor[indexX][indexY]);
   const CO2EmissionFactor = CO2EmissionsFactor[indexX][indexY]
    object.CO2EmissionPerSec = CO2EmissionFactor * object.EnginePower
    const NOxEmissionFactor = NOxEmissionsFactor[indexX][indexY]
    object.NOxEmissionPerSec = NOxEmissionFactor * object.EnginePower
    const PMEmissionFactor = PMEmissionsFactor[indexX][indexY]
    object.PMEmissionPerSec = PMEmissionFactor * object.EnginePower
    
});
// console.log(data)

//SPLITTING DATA IN EVERY MIN



// for (let i = 0; i < 181; i = i + 60) {
    // const timestamps = i.timestamp
    // dataEveryMinute.push(i.timestamp)
    const timestampsEveryMinute = [] 
    
    const startDate = new Date('11/17/2022 10:00:00');
    for (let minute = 0; minute < 34; minute++) {
        timestampsEveryMinute.push(startDate.toLocaleString());
        
        startDate.setSeconds(startDate.getSeconds() + 60);
        
    }
    console.log('dataEveryMinute', timestampsEveryMinute)
    
    const dataEveryMinute = [] 

let CO2EmissionPerMin = 0; 
let NOxEmissionPerMin = 0; 
let PMEmissionPerMin = 0; 
let FuelConsumptionPerMin = 0; 
let enginePowers = [];
let drivingSpeeds = [];
let drillRotationSpeeds = [];
data.forEach((object, index) => {

    // console.log('sumCO2Emission', sumCO2Emission);
    enginePowers.push(object.EnginePower)
    drivingSpeeds.push(object['Driving speed'])
    drillRotationSpeeds.push(object['Drill rotation speed'])
    CO2EmissionPerMin += object.CO2EmissionPerSec;
    PMEmissionPerMin += object.PMEmissionPerSec;
    NOxEmissionPerMin += object.NOxEmissionPerSec;
    FuelConsumptionPerMin += object['Fuel Consumption'];
    for (const property in object) {
        const value = object[property];

        if (property === 'timestamp' && timestampsEveryMinute.includes(value) ) {
            object.CO2EmissionPerMin = CO2EmissionPerMin;
            CO2EmissionPerMin = 0; //can add another one of this with the same logic but not making value zero every min
            
            object.NOxEmissionPerMin = NOxEmissionPerMin;
            NOxEmissionPerMin = 0; 
            
            object.PMEmissionPerMin = PMEmissionPerMin;
            PMEmissionPerMin = 0; 
            
            object.FuelConsumptionPerMin = FuelConsumptionPerMin;
            FuelConsumptionPerMin = 0; 
            
            const maxEnginePower = Math.max(...enginePowers); //... this spreads the elements of hte array (spread operator)
            //can also use to push one array(its elements) inside other array by firstArray.push(...secondArray)
            object.maxEnginePower = maxEnginePower;
            const minEnginePower = Math.min(...enginePowers);
            object.minEnginePower = minEnginePower;
            const AvgEnginePower = enginePowers.reduce((a,b) => a + b, 0) / enginePowers.length ; //... this spreads the elements of hte array (spread operator)
            object.AvgEnginePower = AvgEnginePower;
            enginePowers = []
            
            const maxDrivingSpeed = Math.max(...drivingSpeeds);
            object.maxDrivingSpeed = maxDrivingSpeed;
            const minDrivingSpeed = Math.min(...drivingSpeeds);
            object.minDrivingSpeed = minDrivingSpeed;
            const AvgDrivingSpeed = drivingSpeeds.reduce((a,b) => a + b, 0) / drivingSpeeds.length ; 
            object.AvgDrivingSpeed = AvgDrivingSpeed;
            drivingSpeeds = []
            
            

            const AvgdrillRotationSpeeds = drillRotationSpeeds.reduce((a,b) => a + b, 0) / drillRotationSpeeds.length ; 
            object.AvgdrillRotationSpeed = AvgdrillRotationSpeeds;
            // object['Drill rotation speed'] = AvgdrillRotationSpeeds; if want to replace the drill rotation speed for average
            drillRotationSpeeds = []

            if (object.AvgdrillRotationSpeed !== 0) {
                object.Status = 'Drilling'
            } else if (object.AvgDrivingSpeed !== 0) {
                object.Status = 'Moving'
            } else if (object.AvgDrivingSpeed == 0 && object.AvgdrillRotationSpeed == 0) {
                object.Status = 'Idling'
            }
            


            dataEveryMinute.push(object)
   
    } 
}
}) 
dataEveryMinute.forEach(i=> {
    delete i.EnginePower
    delete i["Engine torque"]
    delete i["Engine speed"]
    delete i["Driving speed"]
    delete i["Drilling speed"]
    delete i["Drill rotation speed"]
    delete i.CO2EmissionFactor
    delete i.CO2EmissionPerSec
    delete i.PMEmissionFactor
    delete i.PMEmissionPerSec
    delete i.NOxEmissionFactor
    delete i.NOxEmissionPerSec
    delete i["Fuel Consumption"]
})




fs.writeFileSync("test1-Converted-Data-Second.json",JSON.stringify(data, null, 2),"utf-8",(err) => { //without "null, 2" in stringify it returns only one array
    if(err) console.log(err)})
    
    fs.writeFileSync("test1-Preprocessed-Data-Minute.json",JSON.stringify(dataEveryMinute, null, 2),"utf-8",(err) => { //without "null, 2" in stringify it returns only one array
        if(err) console.log(err)})
    
    