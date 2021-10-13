// dependencias
let express = require("express");
let router = express.Router();
let sequelize = require("../models").sequelize;

router.post("/cadastro", async (req, res, next) => {
    let { id, id_maquina, nome, senha, empresa } = req.body;
    if (!req.body)
        return res.json({
            status: "erro",
            msg: "Body não fornecido na requisição",
        });
    id_maquina = id_maquina.replace(/-/g, ":").toLowerCase();
    let maquinaExiste = `SELECT * FROM maquina WHERE id_maquina = '${id_maquina}';`;
    let insertMaquina = `INSERT INTO maquina(id_maquina, nome, senha, fk_empresa) VALUES ('${id_maquina}', '${nome}', MD5('${senha}'), '${empresa}')`;
    let insertUsuarioMaquina = `INSERT INTO usuario_maquina(responsavel, fk_usuario, fk_maquina) VALUES ('s', ${id}, '${id_maquina}');`;
    await sequelize
        .query(maquinaExiste, { type: sequelize.QueryTypes.SELECT })
        .then(async (maquinas) => {
            if (maquinas.length == 0) {
                await sequelize
                    .query(insertMaquina, {
                        type: sequelize.QueryTypes.INSERT,
                    })
                    .then(async (response) => {
                        await sequelize
                            .query(insertUsuarioMaquina, {
                                type: sequelize.QueryTypes.INSERT,
                            })
                            .then((responsta) =>
                                res.json({
                                    status: "ok",
                                    msg: "Maquina registrada com sucesso",
                                })
                            )
                            .catch((err) =>
                                res.json({ status: "erro", msg: err })
                            );
                    })
                    .catch((err) => res.json({ status: "erro", msg: err }));
            } else res.json({ status: "erro", msg: "Maquina ja cadastrada" });
        })
        .catch((err) => res.json({ status: "erro", msg: err }));
});

router.post("/lista-dependentes", async (req, res) => {
    let { id } = req.body;
    if (!req.body)
        return res.json({
            status: "erro",
            msg: "Body não fornecido na requisição",
        });
    let dependentes = `SELECT id_maquina, nome FROM maquina JOIN usuario_maquina ON fk_maquina = id_maquina and fk_usuario = ${id}`;
    await sequelize
        .query(dependentes, { type: sequelize.QueryTypes.SELECT })
        .then(async (response) => {
            let maquinas = [];
            for (let { id_maquina, nome } of response) {
                let responsavel = `SELECT usuario.nome FROM usuario JOIN usuario_maquina ON fk_usuario = id_usuario and responsavel = 's' and fk_maquina = '${id_maquina}';`;
                await sequelize
                    .query(responsavel, {
                        type: sequelize.QueryTypes.SELECT,
                    })
                    .then(([{ nome: usuario }]) =>
                        maquinas.push({
                            id_maquina,
                            nome,
                            responsavel: usuario,
                        })
                    )
                    .catch((err) => res.json({ status: "erro", err }));
            }
            res.json({ status: "ok", res: maquinas });
        })
        .catch((err) => res.json({ status: "erro", msg: err }));
});

router.post("/verificar-usuario", async (req, res) => {
    let { id, maquina } = req.body;
    if (!req.body)
        return res.json({
            status: "erro",
            msg: "Body não fornecido na requisição",
        });
    let consulta = `SELECT * FROM usuario_maquina WHERE fk_usuario = ${id} AND fk_maquina = '${maquina}';`;

    await sequelize
        .query(consulta, {
            type: sequelize.QueryTypes.SELECT,
        })
        .then((resposta) =>
            res.json({
                status: "ok",
                msg: resposta,
            })
        )
        .catch((err) => res.json({ status: "erro", err }));
});

router.post("/componentes", async (req, res) => {
    let { id, componentes } = req.body;
    if (!req.body)
        return res.json({
            status: "erro",
            msg: "Body não fornecido na requisição",
        });

    if (!req.body)
        return res.json({
            status: "erro",
            msg: "Body não fornecido na requisição",
        });
    try {
        for (let componente of componentes) {
            let { acao, nome, limite } = componente;
            if (acao === "insert") {
                let sql = `INSERT INTO categoria_medicao VALUES (NULL, ${limite}, '${id}', (SELECT id_tipo_medicao FROM tipo_medicao WHERE tipo = '${nome}'))`;
                await sequelize
                    .query(sql, { type: sequelize.QueryTypes.INSERT })
                    .then((response) => {})
                    .catch((err) => {
                        res.json({ status: "erro", msg: err });
                    });
            } else if (acao === "update") {
                let sql = `UPDATE categoria_medicao SET medicao_limite = ${limite} WHERE fk_maquina = '${id}' AND fk_tipo_medicao = (SELECT id_tipo_medicao FROM tipo_medicao WHERE tipo = '${nome}')`;
                await sequelize
                    .query(sql, { type: sequelize.QueryTypes.UPDATE })
                    .then((response) => {})
                    .catch((err) => {
                        res.json({ status: "erro", msg: err });
                    });
            } else {
                let sql = `DELETE FROM categoria_medicao WHERE fk_maquina = '${id}' AND fk_tipo_medicao = (SELECT id_tipo_medicao FROM tipo_medicao WHERE tipo = '${nome}')`;
                await sequelize
                    .query(sql, { type: sequelize.QueryTypes.DELETE })
                    .then((response) => {})
                    .catch((err) => {
                        res.json({ status: "erro", msg: err });
                    });
            }
        }
        res.json({ status: "ok", msg: "Componentes atualizados" });
    } catch (err) {
        res.json({ status: "erro", msg: err });
    }
});

router.post("/lista-componentes", async (req, res) => {
    let { id } = req.body;
    if (!req.body)
        return res.json({
            status: "erro",
            msg: "Body não fornecido na requisição",
        });

    let sql = `SELECT tipo, medicao_limite FROM categoria_medicao JOIN tipo_medicao ON id_tipo_medicao = fk_tipo_medicao AND fk_maquina = '${id}'`;

    await sequelize
        .query(sql, { type: sequelize.QueryTypes.SELECT })
        .then((response) => {
            res.json({ status: "ok", msg: response });
        })
        .catch((err) => {
            res.json({ status: "erro", msg: err });
        });
});

// delete maquina
router.post("/delete", async (req, res, next) => {
    let { id } = req.body;
    if (!req.body)
        return res.json({
            status: "erro",
            msg: "Body não fornecido na requisição",
        });

    /*
        sequência de deletes

        analytics -> maquina_analytics -> usuario_maquina
        medicao   -> categoria_medicao -> maquina
    */

    // estrutura de deletes
    let sqlDelAnalytics = `DELETE FROM analytics WHERE fk_maquina_analytics = (SELECT id_maquina_analytics FROM maquina_analytics WHERE fk_maquina = '${id}')`;
    let sqlDelMaquinaAnalytics = `DELETE FROM maquina_analytics WHERE fk_maquina = '${id}'`;

    // delete analytics
    await sequelize
        .query(sqlDelAnalytics, { type: sequelize.QueryTypes.DELETE })
        .then(async (resultAnalytics) => {
            // delete maquina_analytics
            await sequelize
                .query(sqlDelMaquinaAnalytics, {
                    type: sequelize.QueryTypes.DELETE,
                })
                .then(async (resultMaquinaAnalytics) => {
                    console.log(resultMaquinaAnalytics);
                    let sql = `SELECT id_categoria_medicao FROM categoria_medicao WHERE fk_maquina = '${id}'`;
                    await sequelize
                        .query(sql, { type: sequelize.QueryTypes.SEELCT })
                        .then(async (fkCategorias) => {
                            let metricas = fkCategorias[0].map(
                                (item) => item.id_categoria_medicao
                            );
                            console.log(metricas);

                            // delete medicao
                            for (let metrica of metricas) {
                                let sqlDelMedicao = `DELETE FROM medicao WHERE fk_categoria_medicao = ${metrica}`;

                                sequelize
                                    .query(sqlDelMedicao, {
                                        type: sequelize.QueryTypes.DELETE,
                                    })
                                    .then(async (resultMedicao) => {
                                        console.log(resultMedicao);

                                        //  delete categoria_medicao
                                        let sqlDelCategoria = `DELETE FROM categoria_medicao WHERE id_categoria_medicao = ${metrica}`;

                                        await sequelize
                                            .query(sqlDelCategoria, {
                                                type: sequelize.QueryTypes
                                                    .DELETE,
                                            })
                                            .then(async (resultCategoria) => {
                                                console.log(resultCategoria);
                                            })
                                            .catch((err) => {
                                                res.json({
                                                    status: "erro",
                                                    msg: err,
                                                });
                                            });
                                    })
                                    .catch((err) => {
                                        res.json({ status: "erro", msg: err });
                                    });
                            }

                            // delete usuario máquina
                            let sqlDelUsMac = `DELETE FROM usuario_maquina WHERE fk_maquina = '${id}'`;

                            await sequelize
                                .query(sqlDelUsMac, {
                                    type: sequelize.QueryTypes.DELETE,
                                })
                                .then(async (resultUsMac) => {
                                    let sqlDeleteMac = `DELETE FROM maquina WHERE id_maquina = '${id}';`;

                                    await sequelize
                                        .query(sqlDeleteMac, {
                                            type: sequelize.QueryTypes.DELETE,
                                        })
                                        .then(async (resultMac) => {
                                            console.log(resultMac);
                                            res.json({
                                                status: "ok",
                                                msg: "Maquina deletada",
                                            });
                                        });
                                });
                        });
                });
        });
});

router.post("/permissao-acesso", async (req, res) => {
    let { id, maquina } = req.body;
    if (!req.body)
        return res.json({
            status: "erro",
            msg: "Body não fornecido na requisição",
        });

    let sql = `INSERT INTO usuario_maquina VALUES (null, 'n', ${id}, '${maquina}');`;

    await sequelize
        .query(sql, { type: sequelize.QueryTypes.INSERT })
        .then((response) => {
            res.json({ status: "ok", msg: "Permissão concedida com sucesso" });
        })
        .catch((err) => {
            res.json({ status: "erro", msg: err });
        });
});

router.post("/lista-usuarios", async (req, res) => {
    let { id } = req.body;
    if (!req.body)
        return res.json({
            status: "erro",
            msg: "Body não fornecido na requisição",
        });

    let sql = `SELECT nome, email FROM usuario JOIN usuario_maquina ON id_usuario = fk_usuario AND fk_maquina = '${id}'`;

    await sequelize
        .query(sql, { type: sequelize.QueryTypes.SELECT })
        .then((response) => {
            res.json({ status: "ok", msg: response });
        })
        .catch((err) => {
            res.json({ status: "erro", msg: err });
        });
});
module.exports = router;
