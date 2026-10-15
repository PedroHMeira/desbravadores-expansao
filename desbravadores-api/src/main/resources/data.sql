-- Roda a cada start, antes do Hibernate atualizar o schema (spring.sql.init.mode=always).
-- Remove duplicados de (user_id, date) em attendance_records, mantendo o registo mais recente
-- (maior id), para permitir a criação da unique constraint uk_attendance_user_date.
-- Numa base de dados nova a tabela ainda não existe neste ponto; o erro é esperado e ignorado
-- (spring.sql.init.continue-on-error=true).
DELETE ar1 FROM attendance_records ar1
INNER JOIN attendance_records ar2
    ON ar1.user_id = ar2.user_id
   AND ar1.date = ar2.date
   AND ar1.id < ar2.id;
