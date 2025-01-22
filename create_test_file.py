import netCDF4 as nc
import numpy as np

# 创建netCDF文件
dataset = nc.Dataset('test.nc', 'w', format='NETCDF4')

# 创建维度
time = dataset.createDimension('time', None)
lat = dataset.createDimension('lat', 10)
lon = dataset.createDimension('lon', 12)

# 创建变量
times = dataset.createVariable('time', 'f4', ('time',))
lats = dataset.createVariable('lat', 'f4', ('lat',))
lons = dataset.createVariable('lon', 'f4', ('lon',))
temp = dataset.createVariable('temp', 'f4', ('time', 'lat', 'lon',))

# 添加全局属性
dataset.description = 'Example netCDF file for testing'
dataset.history = 'Created for VSCode extension testing'
dataset.source = 'Test data'

# 添加变量属性
temp.units = 'K'
temp.long_name = 'Temperature'
temp.valid_range = [-50.0, 50.0]

# 写入一些数据
lats[:] = np.arange(10)
lons[:] = np.arange(12)
times[:] = np.arange(5)
temp[:,:,:] = np.random.uniform(-50, 50, size=(5,10,12))

# 关闭文件
dataset.close()

print("Test netCDF file 'test.nc' has been created successfully!") 