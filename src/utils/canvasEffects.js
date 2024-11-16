export class Point3D {
    constructor(x, y, z) {
      this.x = x;
      this.y = y; 
      this.z = z;
      this.originalX = x;
      this.originalY = y;
      this.originalZ = z;
    }
  
    rotate(mouseX, mouseY) {
      const rotX = (mouseY - window.innerHeight / 2) * 0.0002;
      const rotY = (mouseX - window.innerWidth / 2) * 0.0002;
  
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const tempX = this.originalX * cosY - this.originalZ * sinY;
      const tempZ = this.originalZ * cosY + this.originalX * sinY;
  
      const cosX = Math.cos(rotX);  
      const sinX = Math.sin(rotX);
      this.y = this.originalY * cosX - tempZ * sinX;
      this.z = tempZ * cosX + this.originalY * sinX;
      this.x = tempX;
    }
  
    project(width, height, fov, viewDistance) {
      const factor = fov / (viewDistance + this.z);
      const x = this.x * factor + width / 2;
      const y = this.y * factor + height / 2;
      return { x, y, factor };
    }
  }
  
  export class Line3D {
    constructor(start, end, color = '#00ff00') {
      this.start = start;
      this.end = end;
      this.color = color;
    }
  
    draw(ctx, width, height, fov, viewDistance) {
      const start = this.start.project(width, height, fov, viewDistance);
      const end = this.end.project(width, height, fov, viewDistance);
  
      const alpha = Math.min(1, Math.max(0, 1 - (this.start.z + this.end.z) / 2000));
      ctx.strokeStyle = this.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = Math.min(3, (start.factor + end.factor) / 2);
      
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  }