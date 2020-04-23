const bodyParser = require("body-parser")
const hbs = require('express-handlebars')
const path = require('path')
const express = require('express')
const app = express();
const AWS = require("aws-sdk");

// require('dotenv').config();

let sts = new AWS.STS();
let table = "Asset-Tracker-Hardware-dev";
let docClient;

sts.assumeRole({
    RoleArn: 'arn:aws:iam::455073406672:role/OrganizationAccountAccessRole',
    RoleSessionName: 'assetTracker',
    ExternalId: "AssetTrackerDev"
}, function (err, data) {
    if (err) { // an error occurred
        console.log('Cannot assume role');
        console.log(err, err.stack);
    } else { // successful response
        AWS.config.update({
            accessKeyId: data.Credentials.AccessKeyId,
            secretAccessKey: data.Credentials.SecretAccessKey,
            sessionToken: data.Credentials.SessionToken,
            region: 'eu-west-2'
        });

        docClient = new AWS.DynamoDB.DocumentClient();  // Creates a DynamoDB DocClient under the assumed role credentials
    }
});

app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.engine('.hbs', hbs({
    defaultLayout: 'layout',
    extname: '.hbs'
}));

app.set('view engine', '.hbs');

app.get('/', (req, res) => {
    res.render('index')
})
app.get('/read', (req, res) => {
    res.render('read')
})
app.get('/resource', (req, res) => {
    res.render('resource')
})
app.get('/update', (req, res) => {
    res.render('update')
})
app.get('/delete', (req, res) => {
    res.render('delete',{err: "Please Inpuit the Asset Id of what you would like to delete?"})
})


app.post('/read', (req,res)=>{
    let assetID = req.body.identification
    // console.log(assetID);
    // console.log(req.body)
    let params = {
        TableName: table,
        region: "eu-west-2",
        Key: {
            "assetID": assetID
        }
    }

    
    docClient.get(params, function (err, data) {
        console.log(params);
        
        let getdata = data
        // let arrayData = Object.keys(getdata.Item)
        // console.log(arrayData.length);
        
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
            res.render('read', {err: 'Please enter information in all fields'})
        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            return res.render('read',{getdata: getdata.Item});
        }
    })
})

app.post('/update', (req,res)=>{
    var date = new Date().toISOString()

    let assetID = req.body.identification
    console.log(assetID);
    var params = {
        TableName: table,
        Key: {
            "assetID": assetID
        }
    }
    let updatedPerams = {
        TableName: table,
        Item: {
            "serialID": req.body.serialID,
            "type": req.body.typee,
            "manufacturer": req.body.manufacturer,
            "model": req.body.model,
            "dateOfPurchase": req.body.dateOfPurchase,
            "purchasePrice": req.body.purchasePrice,
            "allocatedTo": req.body.allocatedTo,
            "notes": req.body.notes,
            "dateCreated": date,
            "lastChanged": date
        }
    }
    // console.log(updatedPerams.Item.model);

    
    docClient.get(params, function (err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {

            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            return 
        }
    })


})

// post(create), get(read),put(update),delete(delete)
app.post('/resource', (req, res) => { //create resource method (allows us to create a record in dynamoDB)
    // console.log(req, res);
    var date = new Date().toISOString()
    var params = {
        TableName: table,
        Item: {
            "assetID": req.body.assetID,
            "serialID": req.body.serialID,
            "type": req.body.typee,
            "manufacturer": req.body.manufacturer,
            "model": req.body.model,
            "dateOfPurchase": req.body.dateOfPurchase,
            "purchasePrice": req.body.purchasePrice,
            "allocatedTo": req.body.allocatedTo,
            "notes": req.body.notes,
            "dateCreated": date,
            "lastUpdated": date
        }
    }
    docClient.get(params , function (err,data,added){
        console.log(params.Item.assetID)
    })
    console.log("Adding a new item...");
    docClient.put(params, function (err, data, added) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
            // return res.status(500).send("Unable to add item. Error JSON: " + JSON.stringify(err, null, 2))
            console.log('Failed');
            
            return res.render('resource', {err: 'Please enter information in all fields'})

        } else {
            console.log('Succeeded');
            
            console.log("Added item:", JSON.stringify(data, null, 2));
            return res.render('resource',{added:"Your Asset has been sent to the database!"})
        }
    });
})

app.post('/deleteAsset',(req,res)=>{
    
    var params = {
        TableName: table,
        Key: {
            "assetID": req.body.identification
        }
    }
    console.log("Attempting a deletion...");
    docClient.delete(params, function (err, data) {
        if (err) {
            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
            return res.render('delete', {err: 'Unable to delete item. Try again...'})

        } else {
            console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
            return res.render('delete',{added:'Asset deleted!'})
        }
    });
// }
})


app.post('/updateResource', (req, res) => {// this lets me update the database with things that can change- it will also change the lastupdated section of the
    var date = new Date().toISOString()

    var params = {
        TableName: table,
        Key: {
            "assetID": req.body.identification
        },
        UpdateExpression: "set lastUpdated= :a, model= :b, serialID= :c, typee= :d, manufacturer= :e, dateOfPurchase= :f, purchasePrice= :g, allocatedTo= :h, notes= :i ",
        ExpressionAttributeValues: {
            ":a": date,
            ":b": req.body.model,
            ":c": req.body.serialID,
            ":d": req.body.typee,
            ":e": req.body.manufacturer,
            ":f": req.body.dateOfPurchase,
            ":g": req.body.purchasePrice,
            ":h": req.body.allocatedTo,
            ":i": req.body.notes
            //create for each thing i can update
        },
        ReturnValues: "UPDATED_NEW"
    }
    console.log("Params: ");
    console.log(params.Key.assetID);


    console.log("Updating the item...");
    docClient.update(params, function (err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
            res.render('update', {err: 'Unable to update item.'})
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
            // return res.status(200).send({added: 'Item Updated!'})
            res.render('update', {err: 'Item Updated!'})


        }
    });
})

app.listen(3000, () => {
    console.log('Server listening on port3000');
})