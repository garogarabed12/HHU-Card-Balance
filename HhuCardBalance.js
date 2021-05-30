/*
* @author: Garo Garabed [<garogarabed12@protonmail.com>]
* Credits to: ThisIsBenny (https://github.com/ThisIsBenny/iOS-Widgets)
*
* */

let widgetInputRAW = args.widgetParameter;

//As mentioned on the HHU-Card
let geldboersenID;

//Get Geldbörsen Id from the parameter field.
if (widgetInputRAW !== null) {
    geldboersenID = widgetInputRAW.toString()
} else console.error("Bitte geben Sie die Geldbörsen ID. Sie finden dies auf der Rückseite Ihrer HHU Card")

//Get request
const url = "https://topup.klarna.com/api/STW_DUSSELDORF/cards/" + geldboersenID + "/balance";

var today = new Date()
let cacheMinutes = 4 * 60

// Set up the file manager.
const files = FileManager.local()

// Set up cache
const cachePath = files.joinPath(files.cacheDirectory(), "widget-hhucard-balance")

const cacheExists = files.fileExists(cachePath)

const cacheDate = cacheExists ? files.modificationDate(cachePath) : 0

// Get Data
let result

let lastUpdate

try {
    // If cache exists and it has been less than 30 minutes since last request, use cached data.
    if (cacheExists && (today.getTime() - cacheDate.getTime()) < (cacheMinutes * 60 * 1000)) {
        console.log("Get from Cache")
        result = JSON.parse(files.readString(cachePath))
        lastUpdate = cacheDate
    } else {
        console.log("Get from API")
        const req = new Request(url)
        result = await req.loadJSON()
        lastUpdate = today
        console.log("Write Data to Cache")
        try {
            files.writeString(cachePath, JSON.stringify(result))
        } catch (e) {
            console.log("Creating Cache failed!")
            console.log(e)
        }
    }
} catch (e) {
    console.error(e)
    if (cacheExists) {
        console.log("Get from Cache")
        result = JSON.parse(files.readString(cachePath))
        lastUpdate = cacheDate
    } else {
        console.log("No fallback to cache possible. Due to missing cache.")
    }
}

let balance = (result.balance / 100).toString() + "€"

const imageCachePath = files.joinPath(files.cacheDirectory(), "widget-hhu-logo")
const imageCachePathExists = files.fileExists(imageCachePath)
let logo
if (imageCachePathExists) {
    logo = files.readImage(imageCachePath)
} else {
    //Get a logo when allowed
    const imgReq = new Request('')
    logo = await imgReq.loadImage()
    files.writeImage(imageCachePath, logo)
}

let widget = new ListWidget();

if (!balance) {
    widget.addText('Unable to get HHU-Card balance. Please check logs.')
} else {
    widget.setPadding(10, 10, 10, 10)
    widget.backgroundColor = new Color('#ffffff')

    const logoElement = widget.addImage(logo)
    logoElement.imageSize = new Size(35, 35)
    logoElement.applyFillingContentMode()
    logoElement.centerAlignImage()

    widget.addSpacer(5)

    const time = widget.addText("Heute: " + today.toLocaleTimeString());
    time.font = Font.thinMonospacedSystemFont(15);
    time.textColor = Color.black()
    time.centerAlignText()

    widget.addSpacer(5)

    const message1 = widget.addText("Zuletzt erfasstes");
    message1.font = Font.regularSystemFont(15)
    message1.textColor = Color.black()
    message1.centerAlignText()
    message1.minimumScaleFactor = 0.5
    message1.lineLimit = 1

    const message2 = widget.addText("Guthaben:");
    message2.font = Font.regularSystemFont(15)
    message2.textColor = Color.black()
    message2.centerAlignText()
    message2.minimumScaleFactor = 0.5
    message2.lineLimit = 1


    const pointText = widget.addText(balance)
    pointText.font = Font.regularSystemFont(36)
    pointText.textColor = Color.black()
    pointText.centerAlignText()
    pointText.minimumScaleFactor = 0.5
    pointText.lineLimit = 1

    widget.addSpacer()
}

if (!config.runsInWidget) {
    await widget.presentSmall()
} else {
    // Tell the system to show the widget.
    Script.setWidget(widget)
    Script.complete()
}
