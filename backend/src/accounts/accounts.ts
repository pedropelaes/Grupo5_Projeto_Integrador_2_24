import {Request, RequestHandler, Response} from "express";
import OracleDB from "oracledb";

/*
    Nampespace que contém tudo sobre "contas de usuários"
*/
export namespace AccountsManager {
    
    /**
     * Tipo UserAccount
     */
    /*export type UserAccount = {
        name:string;
        email:string;
        password:string;
        birthdate:string; 
    };
*/

export type UserAccount = {
    id:number| undefined;
    name:string;
    email:string;
    password:string;
    birthdate:string;
};
    // Array que representa uma coleção de contas. 
    let accountsDatabase: UserAccount[] = [];

    /**
     * Salva uma conta no banco de dados. 
     * @param ua conta de usuário do tipo @type {UserAccount}
     * @returns @type { number } o código da conta cadastrada como posição no array.
     */
    export function saveNewAccount(ua: UserAccount) : number{
        accountsDatabase.push(ua);
        return accountsDatabase.length;
    }

    /**
     * Função para tratar a rota HTTP /signUp. 
     * @param req Requisição http tratada pela classe @type { Request } do express
     * @param res    Resposta http a ser enviada para o cliente @type { Response }
     */

    /*
    export const signUpHandler: RequestHandler = (req: Request, res: Response) => {
        console.log('chegamos no log')
        // Passo 1 - Receber os parametros para criar a conta
        const pName = req.get('name');
        const pEmail = req.get('email');
        const pPassword = req.get('password');
        const pBirthdate = req.get('birthdate');
        
        if(pName && pEmail && pPassword && pBirthdate){
            // prosseguir com o cadastro... 
            const newAccount: UserAccount = {
                name: pName,
                email: pEmail, 
                password: pPassword,
                birthdate: pBirthdate
            }
            const ID = saveNewAccount(newAccount);
            res.statusCode = 200; 
            res.send(`Nova conta adicionada. Código: ${ID}`);
        }else{
            res.statusCode = 400;
            res.send("Parâmetros inválidos ou faltantes.");
        }
    }
    */

     async function login(email:string, password:string) {
        //Ajustando a saida para objetos JS.
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

        let connection = await OracleDB.getConnection({
            user: "System",
            password:"995104006",
            connectionString:"localhost/orlc"
        })

        let accountsRows = await connection.execute(
            'SELECT * FROM ACCOUNTS WHERE EMAIL = :email AND PASSWORD = :password',
            [email,password]

        )
            //imprimindo o que veio do oracle
    console.dir(accountsRows.rows)

    }
export const loginHandler: RequestHandler = async (req:Request,res:Response)=>{
    //obtendo os parametros queestao no header da requissição (req)
    const pEmail=req.get('email');
    const pPassword = req.get('password')

    // se as constantes pEmail e pPassword estão definidas (diferentes de undefined)
    //faz o login...
    if(pEmail && pPassword){
        login(pEmail,pPassword)
        //depois vamos complementar a resposta correta...
        //resposta temporaria
        res.statusCode = 200;
        res.send('função login executada...')
    }
    else{
        res.statusCode = 400;
        res.send("Requição invalida. Parametros faltando.")
    }
}

}
