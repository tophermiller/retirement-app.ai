@echo off
echo Syncing to AWS S3 bucket %1.   Check %1.rclone.log for results.

rclone sync --exclude "js/data/odometer/**" ..\web s3:%1 --config .\rclone.conf --verbose --log-file .\%1.rclone.log --transfers 32

call .\cfinval %1

goto done

:done

