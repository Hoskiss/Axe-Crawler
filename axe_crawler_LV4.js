var fs = require('fs'),
    $ = require('cheerio'),
    http = require('http'),
    Promise = require('bluebird'),
    request = require('request');

var init_options = {
    url: "http://axe-level-4.herokuapp.com/lv4/",
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.73.11 (KHTML, like Gecko) Version/7.0.1 Safari/537.73.11',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': "http://axe-level-4.herokuapp.com/lv4/?page=1"
    },
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
            check_options.url = init_options.url+req_options;
        } else {
            reject("Error: Invalid request options " + req_options);
        }
        request(
            check_options,
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

    fs.writeFile("./axe_lv4_output.json", content, function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("The file was saved!");
        }
    });
}

function parseEveryPageLinks(home_page) {
    var every_links = [];
    var every_link_pattern = 'a[href^="?page="]';
    $(home_page).find(every_link_pattern).each(function () {
        every_links.push($(this).attr('href'));
    });

    return every_links;
}

function parseEveryElems(raw_page) {
    var total_elems = this.total_elems;

    var total_elems_pattern = 'td';
    $(raw_page).find(total_elems_pattern).each(function () {
        total_elems.push($(this).text());
    });

    // or not need to return, following used this.total_elems
    return total_elems;
}

function parseElemsFromLinksInOrder(every_links) {
    var this_total_elems = this.total_elems;

    return every_links.map(requestPromise).reduce(
        function(sequence, current_promise) {
            return sequence.then(
                function() {
                    return current_promise;
                }
            ).bind({
                total_elems: this_total_elems
            }).then(
                parseEveryElems
            );
        }, Promise.resolve());
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

requestPromise(init_options).then(
    parseEveryPageLinks
// we need a single container to save results
).bind({
    total_elems: []
}).then(
    parseElemsFromLinksInOrder
).then(
    transferElemsToJson
).then(
    printOutAndSave
).catch(function(err) {
    console.log(err);
});
