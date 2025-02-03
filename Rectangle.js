class Rectangle {
    constructor() {
        this.type = 'rectangle';
        this.position = [0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.size = 5.0;
    }

    render() {
        var xy = this.position;
        var rgba = this.color;
        var size = this.size;

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniform1f(u_Size, size);

        var d = this.size / 200;
        rgba = [1.0, 0.0, 0.0, 1.0];
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        drawRec([xy[0], xy[1], xy[0] + d, xy[1], xy[0], xy[1] + d]);
        rgba = [0.5, 0.5, 0.5, 1.0];
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        drawRec([-xy[0], -xy[1], -xy[0] - d, -xy[1], -xy[0], -xy[1] - d]);
        rgba = [1.0, 1.0, 0.0, 1.0];
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        drawRec([-xy[0], -xy[1], -xy[0] - d, xy[1], xy[0], xy[1] + d]);
        rgba = [0.0, 1.0, 0.0, 1.0];
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        drawRec([xy[0], xy[1], xy[0] + d, -xy[1], -xy[0], -xy[1] - d]);
    }
}

function drawRec(vertices) {
    var n = 3;

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}
