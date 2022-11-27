

const { log } = require('console')
const csvtojson = require('csvtojson')
const fs = require('fs')
const { join, parse } = require('path')
 
const csvfilepath = "rawdata-test2.csv"

csvtojson()
.fromFile(csvfilepath)
.then((json) => {
    // console.log(json)
    fs.writeFileSync("rawdataJSON-test2-string.json",JSON.stringify(json, null, 2),"utf-8",(err) => { //without "null, 2" in stringify it returns only one array
        if(err) console.log(err)
    })
})


// let rawdata = fs.readFileSync('output2.json'); //can also just read output.json here    //another way const data = JSON.parse(fs.readFileSync("output.json"));
// let data = JSON.parse(rawdata);
// console.log(data[0]);

let dataJSON = fs.readFileSync('rawdataJSON-test2-string.json'); //can also just read output.json here    //another way const data = JSON.parse(fs.readFileSync("output.json"));

let data = JSON.parse(dataJSON);
// console.log(pathdata)


fs.writeFileSync("rawdataJSON-test2-parsed.json",JSON.stringify(data, null, 2),"utf-8",(err) => { //without "null, 2" in stringify it returns only one array
    if(err) console.log(err)})

//defining key emission factors 

const MaxEngTorque = 2905.93  
let CO2EmissionsFactor = [
    [0.1,0.1,0.1,0.1],
    [0.2,0.2,0.2,0.2],
    [0.3,0.3,0.3,0.3],
    [0.4,0.4,0.4,0.4]
] //values in table order and in g/kwH

// CO2EmissionsFactor.forEach(collection => { //this converts factors in kwSecond - NOT WORKING THO
//     collection.forEach(factor => {
//         factor /= 3600 // or factor = factor / 3600
//     });
// });

console.log('emission factors', CO2EmissionsFactor[1])


// //THIS IS OPTION for testing different periods of time and replacing it in the object
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
    object.CO2EmissionFactor = CO2EmissionsFactor[indexX][indexY]
    object.CO2Emission = object.CO2EmissionFactor * object.EnginePower
    
});
// console.log(data)

//SPLITTING DATA IN EVERY MIN



// for (let i = 0; i < 181; i = i + 60) {
    // const timestamps = i.timestamp
    // dataEveryMinute.push(i.timestamp)
    const timestampsEveryMinute = [] 
    
    const startDate = new Date('11/17/2022 01:00:00');
    for (let second = 0; second < 13; second++) {
        timestampsEveryMinute.push(startDate.toLocaleString());
        
        startDate.setSeconds(startDate.getSeconds() + 60);
        
    }
    console.log('dataEveryMinute', timestampsEveryMinute)
    
    const dataEveryMinute = [] 

let sumCO2Emission = 0; 
let enginePowers = [];
let drivingSpeeds = [];
let drillingSpeeds = [];
let drillRotationSpeeds = [];
data.forEach((object, index) => {

    // console.log('sumCO2Emission', sumCO2Emission);
    enginePowers.push(object.EnginePower)
    drivingSpeeds.push(object['Driving speed'])
    drillingSpeeds.push(object['Drilling speed'])
    drillRotationSpeeds.push(object['Drill rotation speed'])
    sumCO2Emission += object.CO2Emission;
    for (const property in object) {
        const value = object[property];

        if (property === 'timestamp' && timestampsEveryMinute.includes(value) ) {
            object.sumCO2Emission = sumCO2Emission;
            sumCO2Emission = 0; //can add another one of this with the same logic but not making value zero every min

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
            
            
            const AvgDrillingSpeeds = drillingSpeeds.reduce((a,b) => a + b, 0) / drillingSpeeds.length ; 
            object.AvgDrillingSpeed = AvgDrillingSpeeds;
            drillingSpeeds = []

            const AvgdrillRotationSpeeds = drillRotationSpeeds.reduce((a,b) => a + b, 0) / drillRotationSpeeds.length ; 
            object.AvgdrillRotationSpeed = AvgdrillRotationSpeeds;
            // object['Drill rotation speed'] = AvgdrillRotationSpeeds; if want to replace the drill rotation speed for average

            drillRotationSpeeds = []

            if (object.AvgdrillRotationSpeed !== 0) {
                object.Status = 'Working'
            } else if (object.AvgDrivingSpeed !== 0) {
                object.Status = 'Driving'
            } else if (object.AvgDrivingSpeed == 0) {
                object.Status = 'Idling'
            }
            


            dataEveryMinute.push(object)
   
    } 
}
}) 
dataEveryMinute.forEach(i=> {
    delete i.EnginePower
    delete i["Driving speed"]
    delete i["Drilling speed"]
    delete i["Drill rotation speed"]
    delete i.CO2EmissionFactor
    delete i.CO2Emission
})

console.log('data', dataEveryMinute)

// const newFilteredArray = data.filter(i => 
    
//     i.timestamp === timestampsEveryMinute[1] )





fs.writeFileSync("test2-Dataconverted-Second.json",JSON.stringify(data, null, 2),"utf-8",(err) => { //without "null, 2" in stringify it returns only one array
    if(err) console.log(err)})
    
    fs.writeFileSync("test2-DataFiltered-Minute.json",JSON.stringify(dataEveryMinute, null, 2),"utf-8",(err) => { //without "null, 2" in stringify it returns only one array
        if(err) console.log(err)})
    
    
    
    //         if (typeof i.x === 'string') {
    //             i.x = parseFloat(i.x);
    //         }

// const result = data.find(({ Time }) => Time === '05/19/21 11:41:56')

// console.log(result)

