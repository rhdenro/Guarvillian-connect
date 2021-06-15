module.exports= {
    user: process.env.NODE_ORACLEDB_USER || "system",
    password: process.env.NODE_ORACLEDB_PASSWORD || "1234",
    connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING || "localhost/XE",
    externalAuth: process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false
};