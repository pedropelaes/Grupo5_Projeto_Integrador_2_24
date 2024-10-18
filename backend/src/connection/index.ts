import OracleDB from "oracledb";
import dotenv from 'dotenv';

export default async function conexao (){
    let connection = await OracleDB.getConnection({
        user: process.env.ORACLE_USER,
        password: process.env.ORACLE_PASSWORD,
        connectString: process.env.ORACLE_CONN_STR
    })

    return(connection)

}