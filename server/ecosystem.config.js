module.exports = {
  apps : [{
    name   : "workproj",
    script : "./dist/index.js",
    env_production: {
       NODE_ENV: "production"
    }
  }]
}
