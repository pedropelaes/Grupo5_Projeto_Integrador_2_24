-- Tabela Usuario
CREATE TABLE Usuario (
    id_usuario INT PRIMARY KEY,        -- Chave primária (ajustado conforme o pedido)
    email VARCHAR2(255) NOT NULL UNIQUE,      -- Campo email como string (único)
    nome VARCHAR2(100) NOT NULL,       -- Nome do usuário
    senha VARCHAR2(255) NOT NULL,      -- senha
    data_nascimento DATE NOT NULL      -- Data de nascimento
);

-- Tabela Wallet
CREATE TABLE Wallet (
    id_wallet INT PRIMARY KEY,         -- Chave primária
    saldo NUMBER(10, 2) NOT NULL,      -- Saldo da wallet
    id_usuario INT NOT NULL,           -- FK para Usuario
    CONSTRAINT fk_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
);

-- Tabela Eventos
CREATE TABLE Eventos (
    id_evento INT PRIMARY KEY,          -- Chave primária
    titulo VARCHAR2(50) NOT NULL,       -- Título do evento
    descricao VARCHAR2(150) NOT NULL,   -- Descrição do evento
    dataInicio DATE NOT NULL,           -- Data de início
    dataFim DATE NOT NULL,              -- Data de término
    dataEvento DATE NOT NULL,           -- Data do evento
    status VARCHAR2(30) NOT NULL,       -- Status do evento
    valorCota INT NOT NULL,             -- Valor da cota
    quantidadeCotas INT NOT NULL
);

-- Tabela HistoricoTransacao
CREATE TABLE HistoricoTransacao (
    id_transacao INT PRIMARY KEY,       -- Chave primária
    id_wallet INT NOT NULL,              -- FK para Wallet
    data_transacao DATE NOT NULL,       -- Data da transação
    hora_transacao TIMESTAMP NOT NULL,  -- Hora da transação
    valor NUMBER(10, 2) NOT NULL,       -- Valor da transação
    CONSTRAINT fk_walletTrans FOREIGN KEY (id_wallet) REFERENCES Wallet(id_wallet)
);

-- Tabela HistoricoApostas
CREATE TABLE HistoricoApostas (
    id_aposta INT PRIMARY KEY,          -- Chave primária
    id_evento INT NOT NULL,             -- FK para Eventos
    id_wallet INT NOT NULL,              -- FK para Wallet
    data_aposta DATE NOT NULL,          -- Data da aposta
    hora_aposta TIMESTAMP NOT NULL,     -- Hora da aposta
    valor NUMBER(10, 2) NOT NULL,       -- Valor da aposta
    opcao_aposta int NOT NULL,      -- Opção da aposta (Sim/Não)
    CONSTRAINT fk_eventoAposta FOREIGN KEY (id_evento) REFERENCES Eventos(id_evento),
    CONSTRAINT fk_walletAposta FOREIGN KEY (id_wallet) REFERENCES Wallet(id_wallet)
);

-- Tabela Moderador
CREATE TABLE Moderador (
    id_moderador INT PRIMARY KEY,        -- Chave primária
    email VARCHAR2(255) NOT NULL UNIQUE, -- Email do moderador (único)
    nome VARCHAR2(100) NOT NULL,         -- Nome do moderador
    senha VARCHAR2(100) NOT NULL,        -- Senha do moderador
    data_nascimento DATE NOT NULL        -- Data de nascimento
);