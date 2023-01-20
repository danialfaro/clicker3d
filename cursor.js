const pointer = document.querySelector("#pointer")

document.onmousemove = e => {

    let top = e.clientY + "px";
    let left = e.clientX + "px"

    pointer.style.top = top
    pointer.style.left = left
}