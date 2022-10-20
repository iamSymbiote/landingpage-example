import dummyComp from "./components/dummy";
const homepage = () => {
    console.log("anasayfa");
    dummyComp();
}
window.addEventListener('DOMContentLoaded', (event) => {
    homepage();
});


