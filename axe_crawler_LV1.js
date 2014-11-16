var fs = require('fs'),
    $ = require('cheerio'),
    http = require('http'),
    Promise = require('bluebird');

var options = {
    host: "axe-level-1.herokuapp.com",
    method: 'GET'
};

function requestPromise(options) {
    // Return a new promise.
    return new Promise(function(resolve, reject) {

        var req = http.request(options, function(res) {
            var output = '';

            res.setEncoding('utf-8');
            res.on('data', function (chunk) {
                output += chunk;
            });

            res.on('end', function () {
                if(200 === res.statusCode) {
                    resolve(output);
                } else {
                    reject("Error network response: " + res.statusCode);
                }
            });
        });

        req.on('error', function(err) {
            reject("Error: " + err.message);
        });

        req.end();
    });
}

function parseEveryElems(raw_page) {
    var every_elems = [];
    var every_elems_pattern = 'td';
    $(raw_page).find(every_elems_pattern).each(function () {
        every_elems.push($(this).text());
    });

    return every_elems;
}

function printOutAndSave(content) {
    console.log(content);

    fs.writeFile("./axe_lv1_output.json", content, function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("The file was saved!");
        }
    });
}

function transferElemsToJson(every_elems) {
    var json_format = [];
    var elems_num = every_elems.length;
    for (var person_index = 1; person_index < elems_num/6; person_index++) {

        var each_person = {};
        each_person["name"] = every_elems[6*person_index];
        each_person["grades"] = {};
        for (var subject_index = 1; subject_index < 6; subject_index++) {
            each_person["grades"][every_elems[subject_index]] = parseInt(
                every_elems[6*person_index+subject_index], 10);
        }
        json_format.push(each_person);
    }
    return JSON.stringify(json_format);
}

requestPromise(options).then(
    parseEveryElems
).then(
    transferElemsToJson
).then(
    printOutAndSave
).catch(function(err) {
    console.log(err);
});
