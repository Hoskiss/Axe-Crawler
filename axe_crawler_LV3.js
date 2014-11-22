var fs = require('fs'),
    $ = require('cheerio'),
    http = require('http'),
    Promise = require('bluebird'),
    request = require('request');
    request = request.defaults({jar: true});

var init_options = {
    host: "http://axe-level-1.herokuapp.com",
    path: "/lv3/",
    method: 'GET'
};

// copy obj
function copy(ori_o) {
    var copy_obj = Object.create(Object.getPrototypeOf(ori_o));
    var propNames = Object.getOwnPropertyNames(ori_o);

    propNames.forEach(function(name) {
        var desc = Object.getOwnPropertyDescriptor(ori_o, name);
        Object.defineProperty(copy_obj, name, desc);
    });

    return copy_obj;
}

function requestPromise(req_options) {
    // Return a new promise.
    return new Promise(function(resolve, reject) {

        var check_options = {};
        if("object" === typeof req_options) {
            check_options = copy(req_options);
        } else if ("string" === typeof req_options) {
            check_options = copy(init_options);
            check_options.path = init_options.path+req_options;
        } else {
            reject("Error: Invalid request options " + req_options);
        }
        request(
            check_options.host+check_options.path,
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    resolve(body);
                } else {
                    reject("Error network response: " + response.statusCode);
                }
            }
        );
    });
}

function printOutAndSave(content) {
    console.log(content);

    fs.writeFile("./axe_lv3_output.json", content, function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("The file was saved!");
        }
    });
}

function parseEveryElems(raw_page) {
    var total_elems_pattern = 'td';
    $(raw_page).find(total_elems_pattern).each(function () {
        total_elems.push($(this).text());
    });

    return total_elems;
}

function transferElemsToJson(total_elems) {
    var json_format = [];
    var elems_num = total_elems.length;
    for (var person_index = 1; person_index < elems_num/3; person_index++) {
        if ("鄉鎮" !== total_elems[3*person_index]) {
            var each_person = {};
            each_person["town"] = total_elems[3*person_index];
            each_person["village"] = total_elems[3*person_index+1];
            each_person["name"] = total_elems[3*person_index+2];

            json_format.push(each_person);
        }
    }
    return JSON.stringify(json_format);
}

var path_list = [""];
for (var index = 1; index < 76; index++) {
    path_list.push("?page=next");
}

var total_elems = [];
path_list.reduce(
    function(sequence, path_option) {
        return sequence.then(
            function() {
                return requestPromise(path_option);
            }).then(
                parseEveryElems
            );
    },
    Promise.resolve()
).then(
    transferElemsToJson
).then(
    printOutAndSave
).catch(function(err) {
    console.log(err);
});







