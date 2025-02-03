class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
    }

    render() {
        var rgba = this.color;

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Front side
        drawTriangle3D([0, 0, 0, 1, 1, 0, 1, 0, 0]);
        drawTriangle3D([0, 0, 0, 0, 1, 0, 1, 1, 0]);

        gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);

        // Top side
        drawTriangle3D([0, 1, 0, 0, 1, 1, 1, 1, 1]);
        drawTriangle3D([0, 1, 0, 1, 1, 1, 1, 1, 0]);

        // Bottom side
        drawTriangle3D([1, 0, 1, 1, 0, 0, 0, 0, 0]);
        drawTriangle3D([1, 0, 1, 0, 0, 0, 0, 0, 1]);

        // Back side
        drawTriangle3D([1, 1, 1, 0, 0, 1, 0, 1, 1]);
        drawTriangle3D([1, 1, 1, 1, 0, 1, 0, 0, 1]);

        // Left side
        drawTriangle3D([0, 1, 1, 0, 0, 1, 0, 0, 0]);
        drawTriangle3D([0, 0, 0, 0, 1, 0, 0, 1, 1]);

        // Right side
        drawTriangle3D([1, 0, 0, 1, 1, 0, 1, 1, 1]);
        drawTriangle3D([1, 1, 1, 1, 0, 1, 1, 0, 0]);
    }
}