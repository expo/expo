package expo.modules.devminiapplauncher.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun MiniAppHomeScreen(
    onScanQRCode: () -> Unit = {},
    onConnectToServer: (String) -> Unit = {},
    recentApps: List<String> = emptyList()
) {
    val scrollState = rememberScrollState()
    var devServerUrl by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFFF5F5F5))
                .padding(16.dp)
                .verticalScroll(scrollState)
        ) {
        // Custom Welcome Banner
        MiniAppWelcomeBanner()

        Spacer(modifier = Modifier.height(24.dp))

        // QR Code Scanner Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            elevation = 2.dp,
            shape = RoundedCornerShape(12.dp)
        ) {
            Button(
                onClick = {
                    try {
                        errorMessage = null
                        onScanQRCode()
                    } catch (e: Exception) {
                        errorMessage = "扫码失败: ${e.message}"
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                enabled = !isLoading,
                colors = ButtonDefaults.buttonColors(
                    backgroundColor = Color(0xFF6366F1)
                )
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "📷",
                        fontSize = 24.sp,
                        modifier = Modifier.padding(end = 12.dp)
                    )
                    Column {
                        Text(
                            text = "扫描二维码",
                            color = Color.White,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "连接到开发服务器或加载小程序",
                            color = Color.White.copy(alpha = 0.9f),
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Manual URL Input
        Card(
            modifier = Modifier.fillMaxWidth(),
            elevation = 2.dp,
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "手动输入开发服务器地址",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1F2937)
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = devServerUrl,
                    onValueChange = { devServerUrl = it },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = {
                        Text("http://192.168.1.100:8081")
                    },
                    singleLine = true,
                    colors = TextFieldDefaults.outlinedTextFieldColors(
                        focusedBorderColor = Color(0xFF6366F1),
                        cursorColor = Color(0xFF6366F1)
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                Button(
                    onClick = {
                        try {
                            errorMessage = null
                            isLoading = true
                            // 基本的 URL 验证
                            if (!devServerUrl.startsWith("http://") && !devServerUrl.startsWith("https://")) {
                                errorMessage = "URL 必须以 http:// 或 https:// 开头"
                                isLoading = false
                                return@Button
                            }
                            onConnectToServer(devServerUrl)
                            isLoading = false
                        } catch (e: Exception) {
                            errorMessage = "连接失败: ${e.message}"
                            isLoading = false
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = devServerUrl.isNotEmpty() && !isLoading,
                    colors = ButtonDefaults.buttonColors(
                        backgroundColor = Color(0xFF10B981)
                    )
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = Color.White,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text(
                            text = "连接",
                            color = Color.White,
                            fontSize = 16.sp
                        )
                    }
                }
            }
        }

        // Recent Apps Section
        if (recentApps.isNotEmpty()) {
            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "最近使用",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF1F2937)
            )

            Spacer(modifier = Modifier.height(12.dp))

            recentApps.forEach { appUrl ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    elevation = 1.dp,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "📱",
                            fontSize = 24.sp,
                            modifier = Modifier.padding(end = 12.dp)
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = appUrl,
                                fontSize = 14.sp,
                                color = Color(0xFF374151)
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Info Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            backgroundColor = Color(0xFFEFF6FF),
            elevation = 0.dp,
            shape = RoundedCornerShape(8.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "💡 提示",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1E40AF)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "1. 确保手机和开发服务器在同一网络\n2. 使用二维码快速连接\n3. 或手动输入服务器地址",
                    fontSize = 14.sp,
                    color = Color(0xFF1E40AF).copy(alpha = 0.8f),
                    lineHeight = 20.sp
                )
            }
        }
        }

        // Error Snackbar
        if (errorMessage != null) {
            Snackbar(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(16.dp),
                action = {
                    TextButton(onClick = { errorMessage = null }) {
                        Text("关闭", color = Color.White)
                    }
                },
                backgroundColor = Color(0xFFEF4444)
            ) {
                Text(errorMessage ?: "", color = Color.White)
            }
        }
    }
}

@Composable
private fun MiniAppWelcomeBanner() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(
                brush = Brush.horizontalGradient(
                    colors = listOf(
                        Color(0xFF6366F1),
                        Color(0xFF8B5CF6)
                    )
                )
            )
            .padding(24.dp)
    ) {
        Column {
            Text(
                text = "🚀",
                fontSize = 40.sp
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "MiniApp Container",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "动态加载小程序，随时随地运行",
                fontSize = 16.sp,
                color = Color.White.copy(alpha = 0.95f)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "完全兼容 Expo 开发模式",
                fontSize = 14.sp,
                color = Color.White.copy(alpha = 0.8f)
            )
        }
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
fun MiniAppHomeScreenPreview() {
    MaterialTheme {
        MiniAppHomeScreen(
            recentApps = listOf(
                "http://192.168.1.100:8081",
                "http://10.0.2.2:8081"
            )
        )
    }
}
