import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { NestExpressApplication } from '@nestjs/platform-express';
import { File, FileSchema } from '../src/schemas/file.schema';
import { Folder, FolderSchema } from '../src/schemas/folder.schema';
import { User, UserSchema } from '../src/schemas/user.schema';

async function createIndexes() {
  console.log('🚀 开始创建数据库索引...\n');

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  await app.init();

  try {
    // 获取模型
    const fileModel = app.get(getModelToken(File.name));
    const folderModel = app.get(getModelToken(Folder.name));
    const userModel = app.get(getModelToken(User.name));

    // 创建 File 索引
    console.log('📦 创建 File 索引...');
    await fileModel.syncIndexes();
    console.log('✅ File 索引创建成功');
    console.log('   - owner_id_1_folder_id_1');
    console.log('   - hash_1');
    console.log('   - name_text_tags_text');
    console.log('   - owner_id_1_is_deleted_1_createdAt_-1');
    console.log('   - folder_id_1_name_1');
    console.log('   - owner_id_1_is_pinned_1_createdAt_-1');
    console.log('   - size_1');
    console.log('   - mime_type_1');
    console.log('   - owner_id_1_is_deleted_1_deleted_at_-1\n');

    // 创建 Folder 索引
    console.log('📦 创建 Folder 索引...');
    await folderModel.syncIndexes();
    console.log('✅ Folder 索引创建成功');
    console.log('   - owner_id_1_parent_id_1');
    console.log('   - name_text');
    console.log('   - owner_id_1_is_deleted_1');
    console.log('   - parent_id_1_name_1');
    console.log('   - owner_id_1_is_pinned_1_createdAt_-1');
    console.log('   - path_1');
    console.log('   - createdAt_-1\n');

    // 创建 User 索引
    console.log('📦 创建 User 索引...');
    await userModel.syncIndexes();
    console.log('✅ User 索引创建成功');
    console.log('   - username_1');
    console.log('   - email_1\n');

    console.log('🎉 所有索引创建完成！');
    console.log('\n📊 索引说明：');
    console.log('   - ESR原则：Equality(等值) → Sort(排序) → Range(范围)');
    console.log('   - 复合索引遵循查询模式');
    console.log('   - 文本索引支持全文搜索');
    console.log('   - TTL索引可自动清理过期数据（如需要）\n');

  } catch (error) {
    console.error('❌ 索引创建失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await app.close();
    process.exit(0);
  }
}

// 执行脚本
createIndexes().catch(err => {
  console.error('❌ 脚本执行失败:', err.message);
  process.exit(1);
});
