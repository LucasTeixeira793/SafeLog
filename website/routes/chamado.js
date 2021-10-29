let express = require("express");
let router = express.Router();
let sequelize = require("../models").sequelize;
const {abrirChamado} = require("../util/chamado/abertura");

router.post("/criar", async (req, res) => {
    let {titulo, desc, prioridade, idCategoriaMedicao, idUsuario} = req.body;
    if (!req.body) {
        return res.json({
            status: "erro",
            msg: "Body não fornecido na requisição"
        });
    } else {
        // verificando se usuario tem acesso à máquina
        const sqlUsuarioTemAcesso = `SELECT * FROM usuario_maquina WHERE fk_usuario = ${idUsuario} AND fk_maquina = 
        (SELECT fk_maquina FROM categoria_medicao WHERE id_categoria_medicao = ${idCategoriaMedicao})`;

        await sequelize
            .query(sqlUsuarioTemAcesso, {type: sequelize.QueryTypes.SELECT})
            .then(response => {
                if (response.length > 0) {
                    // usuario tem acesso
                    abrirChamado(
                        titulo,
                        desc,
                        idUsuario,
                        idCategoriaMedicao,
                        prioridade
                    )
                        .then(resposta => {
                            res.json(resposta);
                        })
                        .catch(err => {
                            res.json({status: "erro1", msg: err});
                        });
                } else {
                    const sqlGestorTemAcesso = `SELECT * FROM usuario_maquina JOIN usuario ON fk_usuario = id_usuario AND fk_supervisor = ${idUsuario} AND fk_maquina = (SELECT fk_maquina FROM categoria_medicao WHERE id_categoria_medicao = ${idCategoriaMedicao})`;
                    sequelize
                        .query(sqlGestorTemAcesso, {
                            type: sequelize.QueryTypes.SELECT
                        })
                        .then(async ([response]) => {
                            if (response) {
                                abrirChamado(
                                    titulo,
                                    desc,
                                    idUsuario,
                                    idCategoriaMedicao,
                                    prioridade
                                )
                                    .then(resposta => {
                                        res.json(resposta);
                                    })
                                    .catch(err => {
                                        res.json({status2: "erro", msg: err});
                                    });
                            } else {
                                // usuario não tem acesso
                                res.json({
                                    status: "alerta",
                                    msg: "Usuário não tem acesso à máquina"
                                });
                            }
                        });
                }
            })
            .catch(err => {
                return res.json({
                    status: "erro3",
                    msg: err
                });
            });
    }
});

module.exports = router;
