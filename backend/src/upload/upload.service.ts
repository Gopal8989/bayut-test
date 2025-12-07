import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly uploadPath: string;

  constructor(private configService: ConfigService) {
    this.uploadPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${uniqueSuffix}-${file.originalname}`;
    const filepath = path.join(this.uploadPath, filename);

    fs.writeFileSync(filepath, file.buffer);
    
    // Return URL path (in production, this would be a CDN URL)
    return `/uploads/${filename}`;
  }

  async saveMultipleFiles(files: Express.Multer.File[]): Promise<string[]> {
    const filePaths = await Promise.all(
      files.map(file => this.saveFile(file))
    );
    return filePaths;
  }

  deleteFile(filename: string): void {
    const filepath = path.join(this.uploadPath, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
}

