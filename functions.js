const fs = require('fs');
const path = require('path');
const netrc = require('netrc');
const Heroku = require('heroku-client');

module.exports.createCTFd = function(authData, source) {
    return new Promise((resolve,reject) => {
        var heroku = new Heroku({ token: authData.herokuToken });
            heroku.post('/apps', { body: { stack: "container" } }).then(app => {
                heroku.post(`/apps/${app.name}/addons`, { body: { plan: "heroku-redis:hobby-dev" } } ).then(redis => { });
                heroku.post(`/apps/${app.name}/addons`, { body: { plan: "jawsdb:kitefin" } } ).then(db => {
                    if(db.state == "provisioned") {
                        // get the config for connection string
                        heroku.get(`/apps/${app.name}/config-vars`).then(config => {
                            // add config vars
                            var newConfig = {};
                            if(config['JAWSDB_URL']) {
                                newConfig['DATABASE_URL'] = config['JAWSDB_URL'].replace('mysql:','mysql+pymysql:'); 
                            }
                            newConfig["IMPORT_ID"] = source.importID; 
                            heroku.patch(`/apps/${app.name}/config-vars`, { body: newConfig } ).then(res => {
                                // push a build
                                heroku.post(`/apps/${app.name}/builds`, { body: { source_blob: { url: source.url, version: '1' } } }).then(build => {
                                    console.log(build);
                                    resolve(app);
                                }).catch(err => {
                                    console.log(err);
                                    reject(err);
                                })
                            }).catch(err => {
                                console.log(err);
                                reject(err);
                            })
                        });
                    } else {
                        reject({ error: "Database not provisioned"});
                    }
                }).catch(err => {
                    console.log(err);
                    reject(err);
                });
            });
    });
}
