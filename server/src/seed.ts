/**
 * 初始化脚本 - 创建管理员账号和系统默认配置
 * 使用方法: npx ts-node src/seed.ts
 */
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/private-cloud-storage';

async function seed() {
  console.log('正在连接数据库...');
  await mongoose.connect(MONGODB_URI);
  console.log('数据库连接成功');

  const db = mongoose.connection.db;

  // 1. 创建默认管理员账号
  const adminUser = await db.collection('users').findOne({ role: 'admin' });
  if (!adminUser) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await db.collection('users').insertOne({
      username: 'admin',
      email: 'admin@private-cloud.local',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      storage_used: 0,
      storage_quota: 107374182400, // 100GB for admin
      avatar: '',
      phone: '',
      login_count: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('✓ 管理员账号已创建: admin / admin123');
  } else {
    console.log('✓ 管理员账号已存在，跳过创建');
  }

  // 2. 创建系统默认配置
  const defaultConfigs = [
    { key: 'site_name', value: '私有学习资料云盘', description: '站点名称' },
    { key: 'site_description', value: '永久私有学习资料存储系统', description: '站点描述' },
    { key: 'allow_register', value: 'true', description: '是否允许注册' },
    { key: 'default_storage_quota', value: '10737418240', description: '默认存储配额(字节)' },
    { key: 'max_file_size', value: '10737418240', description: '最大上传文件大小(字节)' },
    { key: 'backup_keep_days', value: '30', description: '备份保留天数' },
    { key: 'auto_clean_recycle_days', value: '30', description: '回收站自动清理天数(0=不自动清理)' },
  ];

  for (const config of defaultConfigs) {
    const exists = await db.collection('system_configs').findOne({ key: config.key });
    if (!exists) {
      await db.collection('system_configs').insertOne({
        ...config,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✓ 系统配置已创建: ${config.key} = ${config.value}`);
    }
  }

  // 3. 创建根目录示例文件夹（可选）
  const admin = await db.collection('users').findOne({ role: 'admin' });
  if (admin) {
    const hasFolder = await db.collection('folders').findOne({ owner_id: admin._id });
    if (!hasFolder) {
      const folders = [
        { name: '学习资料', parent_id: null },
        { name: '电子书', parent_id: null },
        { name: '视频教程', parent_id: null },
        { name: '代码笔记', parent_id: null },
      ];
      for (const folder of folders) {
        let parentId = null;
        await db.collection('folders').insertOne({
          name: folder.name,
          parent_id: parentId,
          owner_id: admin._id,
          path: '/' + folder.name,
          is_encrypted: false,
          is_pinned: folder.name === '学习资料',
          is_deleted: false,
          deleted_at: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`✓ 示例文件夹已创建: ${folder.name}`);
      }
    }
  }

  console.log('\n初始化完成！');
  console.log('================================');
  console.log('管理员账号: admin');
  console.log('管理员密码: admin123');
  console.log('请登录后立即修改密码！');
  console.log('================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('初始化失败:', err);
  process.exit(1);
});
