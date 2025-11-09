# Использование AI в проекте

## Генерация базы данных
Для проектирования и генерации SQL-миграций базы данных был использован **Claude 4.5 Sonnet**.

AI помог создать:
- Схему таблиц (users, feedback, news)
- RLS (Row Level Security) политики для Supabase
- Индексы для оптимизации запросов
- Storage bucket конфигурации для загрузки фото
- Расширения PostgreSQL (pgcrypto для UUID)

Все миграции находятся в файле `supabase-migrations.sql`.

