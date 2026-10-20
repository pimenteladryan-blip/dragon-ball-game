/* =========================================================
   DADOS DO JOGO — personagens, golpes e cenários
   (tudo em português, só o necessário)
   ========================================================= */

/* Golpes de cada lutador:
   - projetil: atirado com o botão de KI (toque rápido)
   - feixe:    segurando o botão de KI (tipo Kamehameha)
   - super:    com o KI em 100% — referência do anime        */

const PERSONAGENS = [
  {
    id: "goku", nome: "Goku", lado: "HERÓI",
    hp: 100, vel: 1.0, poder: 1.0,
    cores: { pele: "#f2c49b", cabelo: "#14141c", roupa: "#f7931e", detalhe: "#2b6bd6", extra: "#ffd21e" },
    cabelo: "espetado",
    golpes: { projetil: "Ki Dourado", feixe: "Kamehameha", super: "Super Kamehameha" },
    coresKi: { projetil: "#ffe066", feixe: "#59c8ff", super: "#8fe8ff" },
    desc: "Equilíbrio perfeito. Domina o Kamehameha.",
  },
  {
    id: "vegeta", nome: "Vegeta", lado: "HERÓI",
    hp: 95, vel: 1.06, poder: 1.06,
    cores: { pele: "#f2c49b", cabelo: "#14141c", roupa: "#2a4bd7", detalhe: "#f2f2f2", extra: "#f2f2f2" },
    cabelo: "vertical",
    golpes: { projetil: "Raio Galick", feixe: "Galick Gun", super: "Final Flash" },
    coresKi: { projetil: "#b07bff", feixe: "#a06bff", super: "#fff06b" },
    desc: "Orgulhoso e rápido. Galick Gun e Final Flash.",
  },
  {
    id: "gohan", nome: "Gohan", lado: "HERÓI",
    hp: 92, vel: 1.0, poder: 1.12,
    cores: { pele: "#f2c49b", cabelo: "#14141c", roupa: "#8039c9", detalhe: "#e02626", extra: "#f2f2f2" },
    cabelo: "franja",
    golpes: { projetil: "Onda de Ki", feixe: "Masenko", super: "Kamehameha Pai & Filho" },
    coresKi: { projetil: "#ffd21e", feixe: "#fff06b", super: "#59c8ff" },
    desc: "Poder explosivo. O Masenko dilacera defesas.",
  },
  {
    id: "piccolo", nome: "Piccolo", lado: "HERÓI",
    hp: 105, vel: 0.94, poder: 1.0,
    cores: { pele: "#4fbf4f", cabelo: null, roupa: "#f2f2f2", detalhe: "#2b8a2b", extra: "#8039c9" },
    cabelo: "namekiano",
    golpes: { projetil: "Bola Namekiana", feixe: "Makankosappo", super: "Hellzone Grenade" },
    coresKi: { projetil: "#7dff9c", feixe: "#ffffff", super: "#42d94a" },
    desc: "Defesa pesada. Makankosappo perfura tudo.",
  },
  {
    id: "broly", nome: "Broly", lado: "VILÃO",
    hp: 120, vel: 0.9, poder: 1.15,
    cores: { pele: "#e8b88a", cabelo: "#14141c", roupa: "#2fae4a", detalhe: "#e0b040", extra: "#e0b040" },
    cabelo: "longo",
    golpes: { projetil: "Esfera Bruta", feixe: "Gigantic Roar", super: "Gigantic Meteor" },
    coresKi: { projetil: "#7dff9c", feixe: "#4fff7a", super: "#d4ff4f" },
    desc: "Fúria imensa: muito HP e dano brutal.",
  },
  {
    id: "jiren", nome: "Jiren", lado: "VILÃO",
    hp: 110, vel: 1.0, poder: 1.1,
    cores: { pele: "#b8bcc8", cabelo: null, roupa: "#d92f2f", detalhe: "#f2f2f2", extra: "#1a1a22" },
    cabelo: "careca",
    golpes: { projetil: "Impacto", feixe: "Onda Total", super: "Poder Total" },
    coresKi: { projetil: "#ff6b6b", feixe: "#ff3b3b", super: "#ffffff" },
    desc: "Sozinho contra todos. Poder total sem limites.",
  },
  {
    id: "bills", nome: "Bills", lado: "VILÃO",
    hp: 100, vel: 1.08, poder: 1.05,
    cores: { pele: "#9b6bd6", cabelo: null, roupa: "#1a2a55", detalhe: "#e0b040", extra: "#e0b040" },
    cabelo: "deus",
    golpes: { projetil: "Distorção", feixe: "Esfera da Destruição", super: "HAKAI" },
    coresKi: { projetil: "#d69bff", feixe: "#b04fff", super: "#7b2fd6" },
    desc: "Deus da destruição. O Hakai apaga o inimigo.",
  },
  {
    id: "cell", nome: "Cell", lado: "VILÃO",
    hp: 105, vel: 0.96, poder: 1.02,
    cores: { pele: "#4fbf4f", cabelo: "#1a1a22", roupa: "#f2f2f2", detalhe: "#8039c9", extra: "#1a1a22" },
    cabelo: "coroa",
    golpes: { projetil: "Death Beam", feixe: "Kamehameha", super: "Kamehameha Perfeita" },
    coresKi: { projetil: "#b07bff", feixe: "#4fff7a", super: "#7dff9c" },
    desc: "Forma Perfeita. Copia e aperfeiçoa os golpes.",
  },
  {
    id: "freeza", nome: "Freeza", lado: "VILÃO",
    hp: 95, vel: 1.1, poder: 1.04,
    cores: { pele: "#f2f2f2", cabelo: "#8039c9", roupa: "#f2f2f2", detalhe: "#8039c9", extra: "#8039c9" },
    cabelo: "domo",
    golpes: { projetil: "Death Beam", feixe: "Onda da Morte", super: "Death Ball" },
    coresKi: { projetil: "#d69bff", feixe: "#b04fff", super: "#ff3b6b" },
    desc: "Velocidade e crueldade. A Death Ball aniquila planetas.",
  },
];

/* Cenários — referências a outros 3 animes */
const CENARIOS = [
  { id: "konoha",   nome: "Vila da Folha",      anime: "referência a NARUTO" },
  { id: "karakura", nome: "Cidade de Karakura", anime: "referência a BLEACH" },
  { id: "taisho",   nome: "Japão Taisho",       anime: "referência a DEMON SLAYER" },
];

/* Funções auxiliares */
function acharPersonagem(id) {
  return PERSONAGENS.find((p) => p.id === id);
}
