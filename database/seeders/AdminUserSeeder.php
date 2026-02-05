<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Creates an initial admin user for system access.
     */
    public function run(): void
    {
        // Check if admin user already exists
        $adminExists = User::where('user_type', 'admin')->exists();

        if (!$adminExists) {
            User::create([
                'name' => 'admin',
                'password' => Hash::make('admin123'),
                'user_type' => 'admin',
                'expired_at' => null, // Never expires
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->command->info('Admin user created successfully!');
            $this->command->info('Username: admin');
            $this->command->info('Password: admin123');
            $this->command->warn('Please change the password after first login!');
        } else {
            $this->command->info('Admin user already exists. Skipping...');
        }
    }
}
